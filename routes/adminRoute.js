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
        session:config.sessionSecret,
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
      // Generate a unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + '.jpg');
    },
  });

const upload = multer({storage:storage,});
const adminController = require('../controller/adminController')
const adminAuth = require('../middleware/adminAuth');
const categoryProductController = require('../controller/categoryProductController')


//=======login===========


adminRoute.get('/',adminAuth.isLogout,adminController.loadLogin)
adminRoute.post('/',adminController.verifyLogin)


adminRoute.get('/home',adminAuth.isLogin,adminController.loadDashboard)
adminRoute.get('/adminLogout',adminAuth.isLogin,adminController.adminLogout)

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
// adminRoute.get.('/editProduct',adminAuth.isLogin,categoryProductController.editProduct)





module.exports = adminRoute