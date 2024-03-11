const product = require('./productModel')
const mongoose = require('mongoose');
const categorySchema = new mongoose.Schema({
    categoryName:{
        type:String,
        required:true,
    },
    associatedProducts:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'product'
    },
    isBlocked:{
        type:Number,
        required:true,
        default:1
    }
})



module.exports = mongoose.model('categories',categorySchema);