const product = require('../model/productModel')
const mongoose = require('mongoose');
const categorySchema = new mongoose.Schema({
    categoryName:{
        type:String,
        required:true
    },
    isBlocked:{
        type:Number,
        required:true,
        default:1
    }
})


module.exports = mongoose.model('categories',categorySchema);