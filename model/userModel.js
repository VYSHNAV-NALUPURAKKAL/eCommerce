// Import the mongoose library for MongoDB schema definition
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    // User's name, a required field of type String
    name: {
        type: String
    },
    // User's email, a required field of type String
    email: {  
        type: String,
        required: true
    },

    // User's mobile number, a required field of type String
    mobile: {
        type: Number,
        required: true
    },

    // User's password, a required field of type String
    password: {
        type: String,
        required: true
    },

    // Flag indicating if the user is verified, a default value of 0 (not verified)
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
    }
});

// Create and export the User model based on the defined schema
module.exports = mongoose.model("User", userSchema);
