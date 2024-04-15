
const Category = require('../model/categoryModel')
const mongoose = require('mongoose');
const Offer = require('../model/offerModel');
const Schema = mongoose.Schema
const productSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    price:{
        type:mongoose.Types.Decimal128,
        required:true
    },
    category:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'categories',
        required:true,

    },
    images:[{
        type:String,
        required:true
    }],
    isBlocked:{
        type:Number,
        required:true,
        default:1
    },
    quantity:{
        type:Number,
        required:true
    },
    offer:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"offer"
    },
    discountedPrice:Number
})


module.exports = mongoose.model('product',productSchema)