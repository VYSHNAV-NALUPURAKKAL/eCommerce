const express = require('express');
const adminRoute = express();

//============view engine setup==============!!!

adminRoute.set('view engine','ejs')
adminRoute.set('views','view')

const session = require('express-session');
const config = require('../config/config');
const { urlencoded } = require('body-parser');

adminRoute.use(
  session({
        secret:config.sessionSecret,
        resave:false,
        saveUninitialized:true
    })
)

adminRoute.use(express.json());
adminRoute.use(express.urlencoded({extended:true}));
adminRoute.use(express.static('public'))

//======image storing================
const multer = require('multer');
const path = require('path')
const { executionAsyncId } = require('async_hooks');


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/adminAssets/product-images');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.jpg');
  },
});

let upload = multer({ storage: storage });

const adminController = require('../controller/adminController')
const adminAuth = require('../middleware/adminAuth');
const categoryProductController = require('../controller/categoryProductController')
const orderController = require('../controller/orderController')
const couponController = require('../controller/couponController');
const offerController = require("../controller/offerController");
//=======login===========


adminRoute.get('/',adminAuth.isLogout,adminController.loadLogin)
adminRoute.post('/',adminController.verifyLogin)


adminRoute.get('/adminLogout',adminAuth.isLogin,adminController.loadLogout)

//customersssssss

adminRoute.get('/customers',adminAuth.isLogin,adminController.seeCustomers)
adminRoute.patch('/block-customer/:id',adminAuth.jsonIsLogin,adminController.updateCustomers)



// ========CATEGORIESS MANAGEMENT==============

adminRoute.get('/categories',adminAuth.isLogin,categoryProductController.seeCategories);
adminRoute.patch('/list-categories/:id',adminAuth.jsonIsLogin,categoryProductController.updateCategories)
adminRoute.put('/edit-categories',adminAuth.jsonIsLogin,categoryProductController.editCategories);
adminRoute.post('/add-categories',adminAuth.jsonIsLogin,categoryProductController.addCategories);

// ============Product management=================

adminRoute.get('/products',adminAuth.isLogin,categoryProductController.seeProducts);
adminRoute.get('/addProduct',adminAuth.isLogin,categoryProductController.showAddProduct)
adminRoute.post('/addProduct',upload.array('product-images',4),categoryProductController.addProduct)
adminRoute.get('/editProduct/:id',adminAuth.isLogin,categoryProductController.showEditProduct)
adminRoute.post('/editProduct/:id', upload.array('product-images',4), categoryProductController.editProduct);
adminRoute.post('/updateProductList',adminAuth.isLogin,categoryProductController.updateProductsList);

// ================Order Management======================

adminRoute.get('/orders',adminAuth.isLogin,orderController.loadOrderManagement)
adminRoute.post('/updateOrder',orderController.updateOrder)
adminRoute.get("/orderSummary/:id",orderController.showOrderSummary)
//====================Coupon Management =========================

adminRoute.get("/coupon",adminAuth.isLogin,couponController.viewCoupon)
adminRoute.post('/addCoupon',adminAuth.isLogin,couponController.addCoupon)
adminRoute.patch('/updateCouponStatus',adminAuth.isLogin,couponController.updateCouponSatus)
adminRoute.delete('/deleteCoupon',adminAuth.isLogin,couponController.deleteCoupon)

//====================Offer Managment================================

adminRoute.get("/offer",adminAuth.isLogin,offerController.getOffer)
adminRoute.post("/addOffer",adminAuth.isLogin,offerController.addOffer)
adminRoute.delete("/deleteOffer",adminAuth.isLogin,offerController.deleteOffer)
adminRoute.post("/applyOffer",adminAuth.isLogin,offerController.applyOffer)
adminRoute.patch("/removeOffer",adminAuth.isLogin,offerController.removeOffer)
adminRoute.post("/applyCategoryOffer",adminAuth.isLogin,offerController.categoryOfferApply)
adminRoute.patch("/removeCategoryOffer",adminAuth.isLogin,offerController.categoryOfferRemove)

// =======================Sales Managment==================
adminRoute.get("/sales",adminAuth.isLogin,adminController.Sales)
adminRoute.post("/salesFilter",adminAuth.isLogin,adminController.Sales)
adminRoute.post("/salesReport",adminAuth.isLogin,adminController.salesReport)

//======================Dashboard Managment ========================================
adminRoute.get('/home',adminAuth.isLogin,adminController.loadHome)

module.exports = adminRoute