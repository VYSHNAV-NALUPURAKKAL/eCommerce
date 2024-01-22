const express = require('express');
const userRoute = express();
const userController = require('../controller/userController')
const userAuth = require('../middleware/userAuth');
const path = require('path')

// -------view engine setup--------
userRoute.set('view engine','ejs')
userRoute.set('views','view')

//-----user session creation------

const session = require('express-session');
const config = require('../config/config');

userRoute.use(
    session({
        secret: config.sessionSecret,
        resave:false,
        saveUninitialized:true
    }))

userRoute.use(express.json());
userRoute.use(express.urlencoded({extended:true}));

//--------------------User Managment----------------------------

userRoute.get('/',userAuth.userBlock,userController.loadHome)
userRoute.get('/signup',userAuth.isLogout,userController.loadSignup);
userRoute.post('/signup',userAuth.isLogout,userController.insertUser);
userRoute.get('/login',userAuth.isLogout,userController.loadLogin);
userRoute.post('/login',userController.verifyLogin)
userRoute.get('/user-blocked',userController.showUserBlock)

// userRoute.get('/forgot-password')
// userRoute.post('/forgot-password')
// userRoute.get('/reset-password')
// userRoute.post('/reset-password')
// userRoute.get('/logout')


//==============OTP MANAGEMENT==============

userRoute.get('/otp-verification',userController.showVerifyOTPPage)

userRoute.post('/otp-verification',userController.verifyOTP)

userRoute.get('/resend-otp',userAuth.isLogout,userController.resendOtp)



module.exports = userRoute;

