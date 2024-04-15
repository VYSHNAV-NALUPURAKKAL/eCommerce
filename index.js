//require the database 
const dotenv = require('dotenv');
dotenv.config()

const express = require('express');

const app = express();

const session = require("express-session")

const { sessionSecret } = require('./config/config');


const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URL);


const path = require('path');

const nocache = require('nocache');

app.use(nocache());

app.set('view engine','ejs')
app.set('views','view')

const userRoute = require('./routes/userRoute');
app.use('/',userRoute);

app.use(express.urlencoded({extended:true}))

app.use(session({
    secret:sessionSecret,
    resave:false,
    saveUninitialized:true
}));

const adminRoute = require('./routes/adminRoute');
app.use('/admin',adminRoute);


app.use('/public',express.static(path.join(__dirname,'public')));






app.listen(1001,()=>{
    console.log("server is listening at port : 1001");
})





