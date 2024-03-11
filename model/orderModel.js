const mongoose = require('mongoose');
const orderSchema = new mongoose.Schema({
    user:{
        type:mongoose.Types.ObjectId,
        ref:'User',
        required:true
    },
    deliveryAddress:{
        type:Object,
        required:true
    },
    payment:{
        type:String,
        required:true,
        method:['Cash On Delivery','Razor Pay','Wallet']
    },
    products:[{
        productId:{
            type:mongoose.Types.ObjectId,
            ref:'product',
            required:true,
        },
        quantity:{
            type:Number,
            required:true
        },
        price:{
            type:Number,
            required:true
        },
        totalPrice:{
            type:Number,
            default:0
        },
        productStatus:{
            type:String,
            default:'pending',
            enum:['pending','placed','delivered','returned or cancelled','shipped','out-for-delivery']
        },
        returnReason:{
            type:String
        }
    }],
    subTotal:{
        type:Number,
        required:true
    },
    orderStatus:{
        type:String,
        default:'pending',
        enum:['pending','placed','returned or cancelled']
    },
    orderDate:{
        type:Date,
        required:true
    }
})

const Order = mongoose.model('Orders',orderSchema)
module.exports = Order; 