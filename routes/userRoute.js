const express = require("express");
const userRoute = express();
const userController = require("../controller/userController");
const categoryProductController = require("../controller/categoryProductController");
const cartController = require("../controller/cartController");
const userAuth = require("../middleware/userAuth");
const addressController = require("../controller/addressController");
const orderController = require('../controller/orderController');
const couponController = require("../controller/couponController")
const path = require("path");

// -------view engine setup--------
userRoute.set("view engine", "ejs");
userRoute.set("views", "view");

//-----user session creation------

const session = require("express-session");
const config = require("../config/config");

userRoute.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: true,
  })
);

userRoute.use(express.json());
userRoute.use(express.urlencoded({ extended: true }));

//--------------------User Managment----------------------------

userRoute.get("/",userController.loadHome);
userRoute.get("/home",userAuth.isLogin, userController.loadHome);


//========================================Login===================================


userRoute.get("/login", userAuth.isLogout, userController.loadLogin);
userRoute.post("/login",userAuth.isLogout, userController.verifyLogin);


//==========================================Logout==================================

userRoute.get('/logout',userController.loadLogout)


//==========================================Signup====================================


userRoute.get("/signup", userAuth.isLogout, userController.loadSignup);
userRoute.post("/signup", userAuth.isLogout, userController.insertUser);


//=======================================Blocked user====================================
userRoute.get("/user-blocked", userController.showUserBlock);


//========================================Profile========================================
userRoute.get("/profile", userAuth.isLogin, userController.showProfile);
userRoute.get("/editProfile", userAuth.isLogin, userController.showEditProfile);
userRoute.post("/editProfile", userController.editProfile);

//==================Address===================================

userRoute.get(
  "/addAddress",
  userAuth.isLogin,
  addressController.loadAddAddress
);
userRoute.post("/addAddress", addressController.addAddress);

userRoute.delete(
  "/deleteAddress/:id",
  userAuth.isLogin,
  addressController.deleteAddress
);

userRoute.get(
  "/editAddress",
  userAuth.isLogin,
  addressController.showEditAddress
);

userRoute.post("/editAddress", addressController.editAddress);
//==========================User Product Page =======================

userRoute.get("/shop", categoryProductController.showShop);
userRoute.get("/product", categoryProductController.singleProductPage);

//=================cart related==============

userRoute.get("/cart", cartController.viewCart);
userRoute.post("/postToCart",userAuth.isLogin, cartController.postToCart);
userRoute.delete("/deleteCart", cartController.deleteFromCart);
userRoute.post("/updateCartQuantity", cartController.updateCartQuantity);

//================Checkout page related================================


userRoute.get('/checkout',userAuth.isLogin,cartController.loadCheckOut)
userRoute.post('/placeOrder',userAuth.isLogin,orderController.checkoutPost)

//========================Order related===============================
userRoute.get('/orderSuccess',userAuth.isLogin,orderController.successPage)
userRoute.get('/orderDetails',userAuth.isLogin,orderController.detailOrder)
userRoute.post('/cancelProductStatus',userAuth.isLogin,orderController.cancelProduct)
userRoute.post('/verify-payment',orderController.verifyPayment)
userRoute.patch("/continuePayment",orderController.continuePayment)
userRoute.patch("/continueVerifyPayment",orderController.continueVerifyPayment)

//========================Coupon Related==================

userRoute.post('/applyCoupon',userAuth.isLogin,couponController.applyCoupon)
userRoute.post('/removeCoupon',userAuth.isLogin,couponController.removeCoupon)

//=====================WISHLISST RELATED=======================================

userRoute.get('/wishlist',userAuth.isLogin,cartController.getWishlist)
userRoute.post("/addToWishlist",userAuth.isLogin,cartController.addToWishlist)


//==============OTP MANAGEMENT==============

userRoute.get("/otp-verification", userController.showVerifyOTPPage);

userRoute.post("/otp-verification", userController.verifyOTP);

userRoute.get("/resend-otp", userAuth.isLogout, userController.resendOtp);

userRoute.post("/invoice",userController.invoice);

module.exports = userRoute;
