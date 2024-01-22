//require the database 
const dotenv = require('dotenv');
dotenv.config()

const express = require('express');

const app = express();

const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URL);


const path = require('path');

const nocache = require('nocache');

app.use(nocache());

app.set('view engine','ejs')
app.set('views','view')

const userRoute = require('./routes/userRoute');
app.use('/',userRoute);


// //for admin route
const adminRoute = require('./routes/adminRoute');
app.use('/admin',adminRoute);


app.use('/public',express.static(path.join(__dirname,'public')));



app.use('*',(req,res)=>{
    try{
        res.render(path.join('user/404'))
    }catch(error){
        console.log(error);
    }
})



app.listen(1001,()=>{
    console.log("server is listening at port : 1001");
})





