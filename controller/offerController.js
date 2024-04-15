//===============Model=====================
const Offer = require("../model/offerModel")
const Product = require("../model/productModel")
const Category = require("../model/categoryModel")
const Cart = require("../model/cartModel")
const Order = require("../model/orderModel")
const Coupon = require("../model/couponModel");
const User = require("../model/userModel");

const mongoose = require("mongoose")
const {ObjectId} = require('mongodb')
const moment = require("moment");

const getOffer = async(req,res)=>{
    try {
        console.log("get offer inside ");
        const offer = await Offer.find({})
        console.log("offer:",offer);
        res.render("admin/offer",{offer,moment});

    } catch (error) {
        console.log("error on get offer :",error);
    }
}

const addOffer = async(req,res)=>{
    try {

        console.log("entered to try of add offer!!")
        console.log("req.bodyyyy :",req.body);
        const offerData = await Offer.findOne({name:req.body.name});
        console.log("offer data :",offerData);
        if(offerData){
            res.json({status:false,add:false})
        }else{
            const newOffer = new Offer({
                name:req.body.name,
                discountAmount:req.body.discount,
                activationDate:req.body.activationDate,
                expiryDate:req.body.expiryDate
            })

            await newOffer.save()
            res.json({add:true,status:true});
        }

    } catch (error) {
        console.log("error on add offer :",error);
    }
}

const deleteOffer = async(req,res)=>{
    try {
        console.log("inside delete offer :","id :",req.body);
        const offerRemoved = await Offer.deleteOne({_id:req.body.offerId})
        res.json({success:true})
    } catch (error) {
        console.error("errror on delete offer adin side :",error);
    }
}

const applyOffer = async(req,res)=>{
    try {
        console.log("inside the try block !!");
        console.log("req.body :",req.body);
        let offerId = req.body.offerId;
        const productId = req.body.productId;
        const offerID = new mongoose.Types.ObjectId(offerId)
        const product = await Product.findOneAndUpdate({_id:productId},{$set:{offer:offerID,discountedPrice:0}},{new:true})

        res.json({success:true})
    } catch (error) {
        console.error("error on apply offer :",error);
    }
}

const removeOffer = async(req,res)=>{
    try {
        console.log("reomve offer inside :req.body",req.body);
        const productId = req.body.productId
        const product = await Product.findOneAndUpdate({_id:productId},{$unset:{offer:1,discountedPrice:1}},{new:true})
        res.json({success:true});

    } catch (error) {
        console.log("error on remove offer ;",error);
    }
}

const categoryOfferApply = async(req,res)=>{
        try {
            console.log("inside of category offer: req.body :", req.body);
            const offerId = req.body.offerId;
            const categoryId = req.body.categoryId;
            
            const category = await Category.findById(categoryId).populate('associatedProducts');
            
            for (const product of category.associatedProducts) {
                product.offer = offerId;
                await product.save();
            }
    
            
            await Category.findByIdAndUpdate(categoryId, { offer: offerId });
    
            res.json({ success: true });
        
    } catch (error) {
        console.log("error on catgeory apply offer :",error);
    }
}


const categoryOfferRemove = async(req,res)=>{
    try {
        console.log("inside of offer remove in category ; req.body: ",req.body);
        const categoryId = req.body.categoryId;
        const category = await Category.findOneAndUpdate({_id:categoryId},{$unset:{offer:1,discountedPrice:1}},{new:true})
        const product = await Product.findOneAndUpdate({category:categoryId},{$unset:{offer:1,discountedPrice:1}},{new:true})
        res.json({success:true});
    } catch (error) {
        console.log("error on categroy offer remove ! :",error);
    }
}

module.exports = {
    getOffer,
    addOffer,
    deleteOffer,
    applyOffer,
    removeOffer,
    categoryOfferApply,
    categoryOfferRemove
}