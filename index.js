const dotenv = require('dotenv');
dotenv.config()

const express = require('express');

const app = express();

const session = require("express-session");

const { sessionSecret } = require('./config/config');


const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URL);


const path = require('path');

const nocache = require('nocache');

app.use(nocache());

app.set('view engine','ejs')
app.set('views','view')

app.use(express.urlencoded({extended:true}))
app.use('/public',express.static(path.join(__dirname,'public')));

app.use(session({
    secret:sessionSecret,
    resave:false,
    saveUninitialized:true
}));

// //for admin route

const userRoute = require('./routes/userRoute');
app.use('/',userRoute);

const adminRoute = require('./routes/adminRoute');
app.use('/admin',adminRoute);


// app.use((req, res) => {
//     try {
//         res.status(404).render('user/404');
//     } catch (error) {
//         console.log(error);
//         res.status(500).render('user/500');
//     }
// });

app.get("*",(req,res)=>{
    res.status(404).render("user/404");
})



app.listen(3000,()=>{
    console.log("server is listening at port : 1001");
})
