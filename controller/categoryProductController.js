const Categories = require("../model/categoryModel");
const Product = require("../model/productModel");

const { name } = require("ejs");
const mongoose = require("mongoose");

const { ObjectId } = require("mongodb");

// =============Categories Management=======================

const seeCategories = async (req, res) => {
  try {
    console.log("categoryl ind ttooo");
    const categories = await Categories.find();
    res.render("admin/categories", { categories });
  } catch (error) {
    console.log(error.message);
  }
};

const updateProductsList = async (req, res) => {
  try {
    console.log("hello", req.body);
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
    console.log("admin controller add categories");
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
  console.log("edit categories");
  try {
    console.log("inside of edit categories");
    let { id, name } = req.body;
    name = name[0].toUpperCase() + name.slice(1).trim().toLowerCase();
    console.log(name, "edit categories");
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
    const products = await Product.find();
    const categories = await Categories.find();
    res.render("admin/products", { products, categories });
  } catch (error) {
    console.log(error);
  }
};

const showAddProduct = async (req, res) => {
  try {
    const categories = await Categories.find({ isBlocked: 1 });
    res.render("admin/addProducts", { categories });
  } catch (error) {
    console.log(error.message);
  }
};

const addProduct = async (req, res) => {
  try {
    let { name, description, category, price, quantity } = req.body;
    console.log("category :", category);
    name = name[0].toUpperCase() + name.slice(1).trim().toLowerCase();
    const images = req.files;
    const x = await Categories.find();
    const category1 = await Categories.findById(category);
    const check = await Product.findOne({ name: name });
    if (!category1) {
      console.log("error on add product");
      return res.status(404).json({ message: "Category not found" });
    }
    if (!check) {
      const newProduct = new Product({
        name,
        description,
        price,
        quantity,
        category: category1.categoryName,
        images: images.map((image) => image.filename),
      });

      await newProduct.save();

      let populatedProduct;
      try {
        populatedProduct = await Product.populate(newProduct, {
          path: "category",
        });
      } catch (error) {
        console.log("Error during population:", error);
      }
      console.log(populatedProduct);
      res.redirect("/admin/products")
    }
  } catch (error) {
    console.log("error on addProduct", error);
    res.render("user/500");
  }
};

const showEditProduct = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id);
    const product = await Product.findOne({ isBlocked: 1, _id: id });
    const categories = await Categories.find({ isBlocked: 1 });

    if (!product) {
      console.log("error on edit product");

      // return res.render('user/404', { message: "Product not found" });
    }
    res.render("admin/editProduct", { product, categories });
  } catch (error) {
    console.log("Error:", error);
    res.status(500).send("Internal Server Error");
  }
};

const editProduct = async (req, res) => {
  console.log("edit product start");
  try {
    let { id, name, description, category, price, quantity,imageIndex } = req.body;
    console.log("req.body :", req.body);
    console.log("req.files", req.files);
    const images = req.files;
    console.log("index :",imageIndex);

    if (!images) {
      return res.status(400).json({ message: "No image provided" });
    }

    name = name[0].toUpperCase() + name.slice(1).trim().toLowerCase();

    const checkExist = await Product.findOne({ name: name, _id: { $ne: id } });

    if (checkExist) {
      return res.json({
        message: "Product with the same name already exists",
        ok: false,
      });
    } 
    const latestImageIndex = parseInt(imageIndex[imageIndex.length - 1]);
    console.log("Latest image index:", latestImageIndex);
    
    const existingProduct = await Product.findById(id);
    existingProduct.images[latestImageIndex] = images[0].filename;
    const updateData = {
      name: name,
      description: description,
      price: price,
      quantity: quantity,
      category: category,
      images: existingProduct.images,
    };

    await Product.findByIdAndUpdate({ _id: id }, updateData);
    res.json({ success: true });
  } catch (error) {
    console.log("Error on edit product", error);
    res.status(500).json({ success: false, error: error.message });
  }
};



//=====================User side=============================

//================Shop Page================

const showShop = async (req, res) => {
  try {
    const user = req.session.user;
    const product = await Product.find();
    const category = await Categories.find({ isBlocked: 1 });
    res.render("user/shop", { product, user, category });
  } catch (error) {
    console.log("error on shop rendering :", error);
  }
};

const singleProductPage = async (req, res) => {
  try {
    const id = req.query.id;
    console.log("querryryryryry", id);
    const user = req.session.user;
    const user_id = user._id;
    const product = await Product.findById(id);
    console.log("product from single :", typeof product);
    res.render("user/singleProductPage", {
      product: product,
      user: user,
      user_id,
    });
  } catch (error) {
    console.log("error on single product page:", error);
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
  updateProductsList,
  showShop,
  singleProductPage,
};
