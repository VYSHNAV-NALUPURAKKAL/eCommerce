const Categories = require("../model/categoryModel");
const Product = require("../model/productModel");
const User = require("../model/userModel")
const Offer = require("../model/offerModel");

const { name } = require("ejs");
const mongoose = require("mongoose");

const { ObjectId } = require("mongodb");

// =============Categories Management=======================

const seeCategories = async (req, res) => {
  try {
    const categories = await Categories.find();
    const offer = await Offer.find()
    res.render("admin/categories", { categories,offer });
  } catch (error) {
    console.log(error.message);
  }
};

const updateProductsList = async (req, res) => {
  try {
    const { itemId, action } = req.body;

    if (action === "list") {
      await Product.findByIdAndUpdate(
        { _id: itemId },
        {
          isBlocked: 1,
        }
      );
    } else {
      const product = await Product.findByIdAndUpdate(
        { _id: itemId },
        {
          isBlocked: 0,
        }
      );
    }
    res.json({ success: true });
  } catch (error) {
    console.log(error);
  }
};

const addCategories = async (req, res) => {
  try {
    let name = req.body.categoryName;
    console.log(name);
    name = name[0].toUpperCase() + name.slice(1).trim().toLowerCase();
    const check = await Categories.findOne({ categoryName: name });
    console.log(check);
    if (!check) {
      console.log(check + "in the if block");
      const category = new Categories({ categoryName: name });
      const result = await category.save();
      console.log(result);
      if (result) {
        res.json({ status: "success", result });
      }
    } else {
      res.json({
        status: "Failed",
        message: "cannot add more than one category multiple times",
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const updateCategories = async (req, res) => {
  try {
    const categories = await Categories.findByIdAndUpdate(
      { _id: req.params.id },
      { $bit: { isBlocked: { xor: 1 } } },
      { new: true }
    );
    if (categories) {
      const message = categories.isBlocked ? "unList" : "List";
      res.json({ message });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const editCategories = async (req, res) => {
  try {
    let { id, name } = req.body;
    name = name[0].toUpperCase() + name.slice(1).trim().toLowerCase();
    const checkExist = await Categories.findOne({ categoryName: name });
    if (!checkExist) {
      const categories = await Categories.findByIdAndUpdate(
        { _id: id },
        { categoryName: name },
        { new: true }
      );
      if (categories) {
        res.json({
          status: "success",
          message: categories.name,
        });
      } else {
        res.json({
          status: "failed",
        });
      }
    } else {
      res.json({
        status: "Failed",
        message: "Category with same name already exist",
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

// ==============================Product controllers ==================================================

const seeProducts = async (req, res) => {
  try {
    let page = 1 ;
    if(req.query.page){
      page=req.query.page;
    }
    const limit = 3;
    const count = await Product.find().countDocuments();

    const products = await Product.find()
      .populate({
        path: "category",
        populate: { path: "offer" } 
      })
      .populate("offer")
      .limit(limit)
      .skip((page-1) * limit)
      .exec()

    const categories = await Categories.find();
    const offer = await Offer.find();
    
    products.forEach(async (product)=>{
    if(product.category.offer){
      const discountedPrice = product.price * (1-product.category.offer.discountAmount /100);
      product.discountedPrice = parseInt(discountedPrice);
      product.offer = product.category.offer

      await product.save()
    }else if(product.offer){
      const discountedPrice = product.price * (1-product.offer.discountAmount /100);
      product.discountedPrice = parseInt(discountedPrice)
      await product.save()
    }
    
    })
    res.render("admin/products", { products, categories,offer,totalPages:Math.ceil(count/limit),currentPage:page });
  } catch (error) {
    console.log(error);
    res.render("user/404")
  }
};

const showAddProduct = async (req, res) => {
  try {
    const categories = await Categories.find({ isBlocked: 1 });
    res.render("admin/addProducts", { categories });
  } catch (error) {
    console.log(error.message);
    res.render("user/500",{message:"show add product error"})
  }
};

const addProduct = async (req, res) => {
  try {
    let { name, description, category, price, quantity } = req.body;
   
    name = name[0].toUpperCase() + name.slice(1).trim().toLowerCase();
    const images = req.files;
    const categories = await Categories.find({ isBlocked: 1 });
    const category1 = await Categories.findById(category);
    const checkExistingProduct = await Product.findOne({ name: name });
    if (!category1) {
      return res.status(404).json({ message: "Category not found" });
    }
    if (!checkExistingProduct) {
      const newProduct = new Product({
        name,
        description,
        price,
        quantity,
        category: category1._id,
        images: images.map((image) => image.filename),
      });
      
      if(price>0 && quantity >0 && images.length>=2){
        await newProduct.save();
      }

      let populatedProduct;
      try {
        populatedProduct = await Product.populate(newProduct, {
          path: "category",
        });
      } catch (error) {
        console.log("user/404", error);
      }
      res.redirect("/admin/products");
    }else{
      res.render("admin/addProducts",{categories,error:"Product name already exists!"})
    }
  } catch (error) {
    console.log("error on addProduct", error);
    res.render("user/500");
  }
};

const showEditProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findOne({ isBlocked: 1, _id: id });
    const categories = await Categories.find({ isBlocked: 1 });

    if (!product) {
      console.log("error on edit product");

      return res.render('user/404', { message: "Product not found" });
    }
    res.render("admin/editProduct", { product, categories });

  } catch (error) {
    console.log("Error:", error);
    res.status(500).render("user/500");
  }
};

const editProduct = async (req, res) => {
  try {
    let { id, name, description, category, price, quantity, imageIndex } =req.body;
    const images = req.files;
    const objectId = mongoose.Types.ObjectId.createFromHexString(id);
    const categoryData = await Categories.findOneAndUpdate({categoryName:category},{$push:{associatedProducts:objectId}},{new:true})

    if (!images) {
      return res.status(400).json({ message: "No image provided" });
    }
    

    name = name.trim()[0].toUpperCase() + name.slice(1).trim().toLowerCase();

    const checkExist = await Product.findOne({ name: name, _id: { $ne: id } });

    if (checkExist) {
      return res.json({
        message: "Product with the same name already exists",
        ok: false,
      });
    }
    const latestImageIndex = parseInt(imageIndex[imageIndex.length - 1]);
    const existingProduct = await Product.findById(id);
    
    
    if (images.length > 0) {
      existingProduct.images[latestImageIndex] = images[0].filename;
    }

    const updateData = {
      name: name,
      description: description,
      price: price,
      quantity: quantity,
      category: categoryData._id,
      images: existingProduct.images,
    };

    await Product.findByIdAndUpdate({ _id: id }, updateData);

    res.json({ success: true, message: "product edited successfully" });
  } catch (error) {
    console.log("Error on edit product", error);
    res.status(500).json({ success: false, error: error.message }).render("user/500");
  }
};


const checkDeleteImage = async (req, res) => {
  try {
      const index = req.body.index;
      const productId = req.body.productId;
      const productData = await Product.findById(productId);

      if (productData.images.length === 1) {
          return res.json({ success: false, message: "Cannot delete the only remaining image" });
      } else {
          
          return res.json({ success: true });
      }
  } catch (error) {
      console.log("Error occurred on checkDeleteImage:", error);
      return res.render("user/500").json({ success: false, message: "Internal server error" });
  }
};

const deletImage = async(req,res)=>{
  try {
    console.log("req.body :",req.body);
    const index = req.body.index
    const productData = await Product.findById({_id:req.body.productId})
    console.log("product data :",productData);
    productData.images.splice(index,1)
    await productData.save()
    res.json({success:true,message:"image removed successfully"})  
  } catch (error) {
    console.log("error occured on delete image :",error);
  }
}


const cropImage = async(req,res)=>{
  try {
    console.log("entered to crop image ,req.body:",req.body);
  } catch (error) {
    console.log("error on crop Image :",error);
  }
}


//=====================User side=============================

//================Shop Page================

  const showShop = async (req, res) => {
    try {
      const user = req.session.user;
      
      const product = await Product.find().populate("offer");
      const category = await Categories.find({ isBlocked: 1 });
      if(!user){
        res.render("user/shop", { product, user, category });
      }else if(user.blocked===1){
        res.redirect("/user-blocked");
      }else{
        res.render("user/shop", { product, user, category });
      }
    } catch (error) {
      console.log("error on shop rendering :", error);
      res.render("user/500",{message:"Internal Sever Error"})
    }
  };

const singleProductPage = async (req, res) => {
  try {
    if(!req.session.user){
      const user = req.session.user
      const id = req.query.id;
      const product = await Product.findById(id);
      res.render("user/singleProductPage", {
        product: product,
        user:user
      });
    }else if(req.session.user){
      const user = req.session.user;
      const user_id = user._id;
      const id = req.query.id;
      const product = await Product.findById(id);
      res.render("user/singleProductPage", {
        product: product,
        user: user,
        user_id,
      });
    }
    
  } catch (error) {
    console.log("error on single product page:", error);
    res.status(500).render("user/500", { message: "Internal server error" });
  }
};

module.exports = {
  seeCategories,
  addCategories,
  editCategories,
  updateCategories,
  seeProducts,
  showAddProduct,
  addProduct,
  showEditProduct,
  editProduct,
  deletImage,
  updateProductsList,
  showShop,
  singleProductPage,
  cropImage,
  checkDeleteImage
};

