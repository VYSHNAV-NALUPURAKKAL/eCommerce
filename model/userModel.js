// Import the mongoose library for MongoDB schema definition
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

    name: {
        type: String
    },
  
    email: {  
        type: String,
        required: true
    },

   
    mobile: {
        type: Number,
        required: true
    },

   
    password: {
        type: String,
        required: true
    },

   
    is_verified: {
        type: Boolean,
        default: true
    },
    
    is_listed : {
        type:Boolean,
        default:false
    },
    blocked:{
        type:Number,
        default:0,
        required:true
    },
    address:[
        {
            fullName:{
                type:String,
                required:true,
                trim:true
            },
            mobile:{
                type:Number,
                required:true,
                trim:true
            },
            email:{
                type:String,
                required:true,
                trim:true
            },
            houseName:{
                type:String,
                required:true,
                trim:true
            },
            state:{
                type:String,
                required:true,
                trim:true
            },
            city:{
                type:String,
                required:true,
                trim:true
            },
            pin:{
                type:String,
                required:true,
                trim:true
            },
        }
    ],
    referalCode:{
        type:String
    },
    wallet:{
        type:Number,
        default:0
    },
    walletHistory:[{
        date:{
            type:Date
        },
        amount:{
            type:Number
        }
    }]
});

// Create and export the User model based on the defined schema
module.exports = mongoose.model("User", userSchema);
