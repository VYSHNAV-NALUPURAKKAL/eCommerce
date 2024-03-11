const mongoose = require("mongoose");
const objectId = mongoose.Schema.Types.ObjectId


const wishlistSchema = new mongoose.Schema({
    user:{
        type: objectId,
        required: true,
        ref: "User",
    },
    product:[{
        productId:{
            type: objectId,
            required:true,
            ref:"product"
        }
    }]
})


module.exports = mongoose.model("Wishlist",wishlistSchema);