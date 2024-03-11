const User = require("../model/userModel");
const bcrypt = require("bcrypt");
const randomstring = require("randomstring");
require("dotenv").config();

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.error(error.message);
  }
};

const loadLogin = async (req, res) => {
  try {
    console.log("loadlogin");
     res.render("admin/adminLogin", {
      message: "Enter Your Email and Password",
    });
  } catch (error) {
    console.error(error, "An Error on Admin Login");
  }
};

const loadLogout = async(req,res)=>{
  console.log("load logout daaa","adminn :",req.session.admin_id);
  try{
    req.session.admin_id=false;
    res.redirect("/admin")

  }catch(error){
    console.error("error on load logout :",error);
  }
  
}


const verifyLogin = async (req, res) => {
  try {
    console.log("verify login");
    const email = req.body.email;
    const password = req.body.password;
    console.log(email, password);

    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASS
    ) {
      req.session.admin_id = "admin_og";
      res.render("admin/home", { message: process.env.ADMIN_NAME });
    } else {
      return res.render("admin/adminLogin", {
        message: "Email and Pass word do not match",
      });
    }
  } catch (error) {
    console.error(error, "an error occurd on admin verify");
  }
};

const loadDashboard = async (req, res) => {
  try {
    res.render("admin/home");
  } catch (error) {
    console.error(error, "dashboard loading error");
  }
};


// ==============================================
const seeCustomers = async (req, res) => {
  try {
    let search = "";
    if (req.query.search) {
      search = req.query.search;
    }

    const customers = await User.find({
      $or: [
        {
          name: { $regex: ".*" + search + ".*", $options: "i" },
        },
        {
          email: { $regex: ".*" + search + ".*", $options: "i" },
        },
        {
          phone: { $regex: ".*" + search + ".*" },
        },
      ],
    });

    res.render("admin/customers", { customers, search });
  } catch (error) {
    console.log(error);
  }
};

const updateCustomers = async (req, res) => {
  try {
    console.log("updatecustomersss");
    const userData = await User.findByIdAndUpdate(
      { _id: req.params.id },
      { $bit: { blocked: { xor: 1 } } },
      { new: true }
    );
    if (userData) {
      const message = userData.blocked ? "Unblock" : "Block";
      res.json({ message });
    }
  } catch (error) {
    console.log(error.message);
  }
};

// ==================================================

module.exports = {
  securePassword,
  loadLogin,
  verifyLogin,
  loadDashboard,
  seeCustomers,
  updateCustomers,
  loadLogout
};
