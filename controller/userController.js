const User = require("../model/userModel");
const otp = require("../model/otpModel");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const randomstring = require("randomstring");
const config = require("../config/config");
const { ObjectId } = require("mongodb");
const dotenv = require("dotenv");
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
    for (let i = 0; i < (req.body.otp).length; i++) {
      otp += req.body.otp[i];
    }

  const {name,email,mobile,password} = req.session.user
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
    // Check if the user already exists
    const userCheck = await User.findOne({ email: req.body.email });

    if (userCheck) {
      return res.render("user/signup", { message: "User already exists" });
    }

    // Check if the mobile number already exists
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
    // await newUser.save();

    // Set session variables
    // req.session.name = req.body.name;
    // req.session.email = req.body.email;
    // req.session.mobile = req.body.mobile;
    // req.session.otp = {
    //   code: otpDigit,
    //   expire: expirationTime,
    // };
    req.session.user = newUser;
    console.log(req.session.otp);

    sendVerifyMail(
      req.session.user.name,
      req.session.user.email,
      req.session.otp
    );

    // Redirect to the OTP verification page
    res.redirect("/otp-verification");
  } catch (error) {
    console.error(error);
    res.render("user/500"); // You might want to create a specific error page
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
const loadLogout =async (req,res)=>{
     try {
        
    } catch (error) {
    
    }
}
//=================LOGIN VERIFY=============

const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const userData = await User.findOne({ email: email  });
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
            req.session.blocked = userData.blocked

            res.redirect("/");
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
  
    res.render("user/home",{user:req.session.user});
};


//=================
const showUserBlock = async(req,res)=>{
  try {
    res.render('user/userBlockPage')
  } catch (error) {
    console.log(error.message);
    return error
  }
}

module.exports = {
  loadSignup,
  insertUser,
  loadLogin,
  verifyLogin,
  resendOtp,
  loadHome,
  showVerifyOTPPage,
  generateOTP,
  verifyOTP,
  sendResetPasswordMail,
  securePassword,
  sendVerifyMail,
  showUserBlock
};
