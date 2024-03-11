const User = require("../model/userModel");
const otp = require("../model/otpModel");
const Product = require("../model/productModel");
const Category = require("../model/categoryModel");
const Order = require("../model/orderModel");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const randomstring = require("randomstring");
const config = require("../config/config");
const { ObjectId } = require("mongodb");
const dotenv = require("dotenv");
const { EventEmitterAsyncResource } = require("nodemailer/lib/xoauth2");
dotenv.config();

//============SECURE PASSWORD==============
const securePassword = async (password) => {
  try {
    console.log(password);
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.error(error);
    throw new Error("Error hashing password");
  }
};

//================OTP GENERATION================

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendVerifyMail = async (name, email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.NODE_MAILER_EMAIL,
        pass: process.env.NODE_MAILER_PASS,
      },
    });

    const mailoptions = {
      from: "vnalupurakkal@gmail.com",
      to: email,
      subject: "verification Mail",
      html:
        '<div style="text-align: center; background-color: Ivory; height: 200px;">' +
        '<h2 style="color:red;">Welcome to STREAK-X</h2>' +
        "<h3>Hello, <b>" +
        name +
        "</b>Thank you for joining us. Your OTP is : </h3>" +
        '<div style="vertical-align: center;"><h1 style="color: blue;">' +
        otp +
        "</h1></div>" +
        "</div>",
    };
    console.log("otp send to email :",otp);
    transporter.sendMail(mailoptions, (error, info) => {
      if (error) {
        console.error(error);
      } else {
        console.log("Email Sent :" + info.response);
      }
    });
  } catch (error) {
    console.log("error on email", error);
    res.render("user/500");
  }
};

//===========OTP VERIFY=================

const verifyOTP = async (req, res) => {
  try {
    let otp = "";
    console.log(req.body.otp.length);
    for (let i = 0; i < req.body.otp.length; i++) {
      otp += req.body.otp[i];
    }
    
    const { name, email, mobile, password } = req.session.user;
    if (parseInt(otp) === parseInt(req.session.otp)) {
      const userData = new User({
        name: name,
        email: email,
        mobile: mobile,
        password: password,
        is_verified: 1,
      });

      const saved = await userData.save();
      if (saved) {
        req.session.user = null;
        res.redirect("/login");
      }
    } else {
      res.render("user/otp-verification", { message: `Invalid OTP` });
    }
  } catch (error) {
    console.log(error);
    res.render("user/500");
  }
};

//=============RESET MAIL===========

const sendResetPasswordMail = async (name, email, token) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: config.userEmail,
        pass: config.userPassword,
      },
    });
    const mailoptions = {
      from: config.userEmail,
      to: email,
      subject: "For reset password",
      html:
        "<p>Hii " +
        name +
        ', please click here to  <a href="http://127.0.0.1:1001/reset-password?token=' +
        token +
        '"> Reset  </a> your password',
    };

    transporter.sendMail(mailoptions, (error, info) => {
      if (error) {
        res.render("user/500");
      } else {
        console.log("Email has been send", info.response);
      }
    });
  } catch (error) {
    console.log("2", error);
    res.render("user/500");
  }
};

//==============OTP verification Page===============

const showVerifyOTPPage = async (req, res) => {
  try {
    res.render("user/otp-verification");
  } catch (error) {
    console.log(error);
    res.render("500");
  }
};

//=================RESEND OTP====================

const resendOtp = (req, res) => {
  try {
    const currentTime = Date.now() / 1000;

    if (req.session.otp.expire != null) {
      if (currentTime > req.session.otp.expire) {
        const newDigit = otpGenerator.generate(6, {
          digits: true,
          alphabets: false,
          specialChars: false,
          upperCaseAlphabets: false,
          lowerCaseAlphabets: false,
        });
        req.session.otp.code = newDigit;
        const newExpiry = currentTime + 30;

        req.session.otp.expire = newExpiry;
        sendVerifyMail(
          req.session.name,
          req.session.email,
          req.session.otp.code
        );
        res.render("user/otp-verification", {
        message: `New OTP send to ${req.session.email}`,
        });
      } else {
        res.render("user/otp-verification", {
          message: `OTP send to ${req.session.email},resend after 30 second`,
        });
      }
    } else {
      res.send("Already Registered");
    }
  } catch (error) {
    res.render("user/500");
  }
};

//--------------LOAD SIGNUP----------------
const loadSignup = async (req, res) => {
  try {
    res.render("user/signup");
  } catch (error) {
    res.render("user/500");
  }
};

//==================INSERT USER================
const insertUser = async (req, res) => {
  try {
    const userCheck = await User.findOne({ email: req.body.email });

    if (userCheck) {
      return res.render("user/signup", { message: "User already exists" });
    }
    const userMob = await User.findOne({ mobile: req.body.mobile });

    if (userMob) {
      return res.render("user/signup", {
        message: "Mobile number already exists",
      });
    }

    // Create a new User instance and save to the database
    console.log("1", req.body.password);
    const spassword = await securePassword(req.body.password);

    if (!spassword) {
      // Handle the case where password hashing failed
      return res.render("user/signup", { message: "Error creating user" });
    }

    const newUser = new User({
      name: req.body.name,
      email: req.body.email,
      mobile: req.body.mobile,
      password: spassword,
    });
    const otp = generateOTP();
    req.session.otp = otp;
    req.session.user = newUser;
    console.log(req.session.otp);

    sendVerifyMail(
      req.session.user.name,
      req.session.user.email,
      req.session.otp
    );

    res.redirect("/otp-verification");
  } catch (error) {
    console.error(error);
    res.render("user/500");
  }
};

//============LOAD LOGIN===============

const loadLogin = async (req, res) => {
  try {
    console.log("ivdethyyyyy");
    res.render("user/login");
  } catch (error) {
    console.error(error);
    res.render("user/500");
  }
};

//=============LOAD LOGOUT===============
const loadLogout = async (req, res) => {
  try {
    req.session.user = false;
    res.redirect("/");
  } catch (error) {
    console.log("error on load logout :", error);
  }
};
//=================LOGIN VERIFY=============

const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const userData = await User.findOne({ email: email });
    if (userData) {
      if (userData.is_listed === false) {
        const passwordMatch = await bcrypt.compare(password, userData.password);
        if (passwordMatch) {
          if (userData.is_verified === false) {
            req.session.user = userData;

            res.render("user/login", { message: `Please Verify Your Email` });
          } else {
            req.session.user = userData;
            req.session.mail = userData.email;
            req.session.blocked = userData.blocked;

            res.redirect(`/home`);
          }
        } else {
          res.render("user/login", {
            message: `Password you provided is Incorrect`,
          });
        }
      } else {
        res.render("user/login", { message: ` Blocked` });
      }
    } else {
      res.render("user/login", { message: `Email you provided is Incorrect` });
    }
  } catch (error) {
    res.render("user/500");
  }
};

//==========LOAD HOME==================

const loadHome = async (req, res) => {
  try {
    const user = req.session.user;
    const products = await Product.find({ category: 1 }).exec();
    const category = await Category.find({ isBlocked: 1 })
      .populate("associatedProducts")
      .exec();
    console.log("producs category from load home :", products);
    res.render("user/home", { user, products, category });
  } catch (error) {
    console.log("error on load home ", error);
  }
};

//=================
const showUserBlock = async (req, res) => {
  try {
    res.render("user/userBlockPage");
  } catch (error) {
    console.log(error.message);
    return error;
  }
};

//===================user profile page==========
const showProfile = async (req, res) => {
  try {
    const user = req.session.user;
    console.log(user._id);
    const userData = await User.findOne({ _id: user._id });
    console.log("req.body :", req.body);
    let page = 1;
    console.log("req query :", req.query.page);
    if (req.query.page) {
      page = req.query.page;
    }
    const limit = 4;
    const orders = await Order.find({ user: user._id })
      .sort({orderDate:-1})
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    const count = await Order.find({ user: user._id }).countDocuments();
    console.log("counttt of orders :", count);
    if (userData) {
      res.render("user/profile", {
        userData,
        user,
        orders,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
      });
    }
  } catch (error) {
    console.log("error at showProfile:", error);
  }
};

const showEditProfile = async (req, res) => {
  try {
    const user = req.session.user;
    console.log("show edit :", user);
    if (user) {
      res.render("user/editProfile", { user });
    }
  } catch (error) {
    console.log("error on show edit profile :", error);
  }
};

const editProfile = async (req, res) => {
  try {
    const user = req.session.user;
    if (user) {
      console.log(
        user._id,
        `name:${req.body.name},email:${req.body.email},${req.body.mobile}`
      );
      const userData = await User.findByIdAndUpdate(
        { _id: user._id },
        {
          $set: {
            name: req.body.name,
            email: req.body.email,
            mobile: req.body.mobile,
            password: req.body.password,
          },
        }
      );
      if (userData) {
        console.log("userData :", userData);
        res.redirect("/profile");
      } else {
        res.redirect("/");
      }
    }
  } catch (error) {
    console.log("error:", error);
  }
};

module.exports = {
  loadSignup,
  insertUser,
  loadLogin,
  loadLogout,
  verifyLogin,
  resendOtp,
  loadHome,
  showVerifyOTPPage,
  generateOTP,
  verifyOTP,
  sendResetPasswordMail,
  securePassword,
  sendVerifyMail,
  showUserBlock,
  showProfile,
  showEditProfile,
  editProfile,
};
