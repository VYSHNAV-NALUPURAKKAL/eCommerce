const mongoose = require("mongoose");
const offerSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    discountAmount:{
        type:Number
    },
    activationDate:{
        type:Date,
        required:true
    },
    expiryDate:{
        type:Date,
        required:true
    },
    isBlocked:{
        type:Boolean,
        default:false
    }
})

const offerModel = mongoose.model("offer",offerSchema)
module.exports = offerModel;

