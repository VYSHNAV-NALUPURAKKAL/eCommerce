
const Categories = require('../model/categoryModel');
const Product = require('../model/productModel')

const { name } = require('ejs');

// =============Categotries Management=======================


const seeCategories = async (req,res)=>{
    try {
        console.log("categoryl ind ttooo");
        const categories = await Categories.find();
        res.render('admin/categories',{categories})
    } catch (error) {
        console.log(error.message);
    }
}



const addCategories = async(req,res)=>{
    try {
        console.log("admin controller add categories");
        let name = req.body.categoryName;
        console.log(name);
        name = name[0].toUpperCase()+name.slice(1).trim().toLowerCase()
        const check = await Categories.findOne({ categoryName:name })
        console.log(check);
        if(!check){
            console.log(check+"in the if block");
            const category = new Categories({categoryName:name});
            const result = await category.save()
            console.log(result);
            if(result){
                res.json({status:"success",result});
            }
        }else{
            res.json({
                status:"Failed",
                message:"cannot add more than one category multiple times"
            })
        }
    } catch (error) {
        console.log(error.message);
    }
}


const updateCategories = async(req,res)=>{
    try {
        const categories = await Categories.findByIdAndUpdate(
            {_id:req.params.id},
            {$bit:{isBlocked:{xor:1} } },
            {new:true}
        );
        if(categories){
            const message = categories.isBlocked?"unList":"List";
            res.json({message});
        }
    } catch (error) {
        console.log(error.message);
    }
}

const editCategories = async(req,res)=>{
    console.log("edit categories");
    try {
        console.log("inside of edit categories");
        let {id,name} = req.body;
        name = name[0].toUpperCase()+name.slice(1).trim().toLowerCase();
        console.log(name,"edit categories");
        const checkExist = await Categories.findOne({categoryName:name})
        if(!checkExist){
            const categories = await Categories.findByIdAndUpdate(
                {_id:id},
                {categoryName:name},
                {new:true}
                )
                if(categories){
                    res.json({
                        status:"success",
                        message:categories.name
                    })
                }else{
                    res.json({
                        status:"failed"
                    })
                }
        }else{
            res.json({
                status:"Failed",
                message:"Category with same name already exist"
            })
        }
    } catch (error) {
        console.log(error.message);
    }
}
// ==============================Product controllers ==================================================

const seeProducts = async (req,res)=>{
    try {
        console.log("productil ethiyirukkunnuuu");
        const products = await Product.find();
        const categories = await Categories.find();
        res.render('admin/products',{products,categories});
    } catch (error) {
        console.log(error)
    }
}

const showAddProduct = async (req,res)=>{
    try {
        console.log('enthaa mone show add product work aavaatthe')
        const categories =  await Categories.find({isBlocked:1})
        res.render('admin/addProducts',{categories})
    } catch (error) {
        console.log(error.message);
    }
}

const addProduct = async (req, res) => {
    try {
        console.log("add product work aavndo??");
        console.log(req.body)
        const { name, description, category, price } = req.body;
        const images = req.files;
        const x = await Categories.find()
        console.log(x,"ith add product")
        console.log("category console",category)
        // Check if the category with the given ID exists
        const category1 = await Categories.findById(category);
        if (!category1) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Create a new product with the given details and category ID
        const newProduct = new Product({
            name,
            description, // Add the description if it's part of the form data
            price,
            category:category1.categoryName, // Assign the category ID to the product
            images: images.map(image => image.filename), // Save the filenames of the uploaded images
            // Add other product details as needed
        });

        // Save the new product to the database
        await newProduct.save();

        let populatedProduct;
    try {
        populatedProduct = await Product.populate(newProduct, { path: 'category' });
    } catch (error) {
        console.log('Error during population:', error);
    }
    console.log(populatedProduct);
        res.status(201).json({ message: 'Product added successfully',product:populatedProduct });
    } catch (error) {
        console.log("error on addProduct",error);
        res.render('user/500')
        
    }
};


const editProduct = async(req,res)=>{
    console.log("outside of edit product");
    try {
        console.log('edit product');
        const {id,name,description,category,price} = req.body;
        const images = req.files;

        const pdt = await Product.findById({id})
        if(pdt && pdt.name === name){
            console.log("product with same name already exists !!");
            res.render('user/404',{message:"product with same name already exists "})
        }else{ 
            pdt.name = name;
            pdt.description = description;
            pdt.category = category;
            pdt.price = price; 
            pdt.images = images;
        }
    } catch (error) {
        console.log("error on edit product",error);
    }
}






module.exports = {
    seeCategories,
    addCategories,
    editCategories,
    updateCategories,
    seeProducts,
    showAddProduct,
    addProduct
}