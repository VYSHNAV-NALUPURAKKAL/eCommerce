const mongoose = require('mongoose');

const OTPSchema = new mongoose.Schema({
    otpId:{
        type:String,
        required:true
    },
    otp:{
        type:Number,
        required:true
    },
    createdAt:{
        type:Date,
        default:Date.now,
        expires:60 * 1
    }
})

module.exports = mongoose.model("OTP",OTPSchema);