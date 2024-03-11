const mongoose = require('mongoose');
const cartSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:'user'
    },
    items:[
    {
        productId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'product',
            required:true
        },
        quantity:{
            type:Number,
            required:true,
            default:1
        },
        price:{
            type:Number,
            required:true
        },
        totalPrice:{
            type:Number,
            default:0
        }
    }],
    couponDiscount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Coupon",
        default: null,
    }
    
})


module.exports = mongoose.model("Cart",cartSchema);
