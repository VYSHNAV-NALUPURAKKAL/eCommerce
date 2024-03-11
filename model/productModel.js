
const Category = require('../model/categoryModel')
const mongoose = require('mongoose');

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
        type:String,
        required:true,
        // type:mongoose.Types.ObjectId,
        // // required:true,
        ref:'categories'
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
        type:Number
    }
})


module.exports = mongoose.model('product',productSchema)