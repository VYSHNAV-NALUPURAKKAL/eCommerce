const isLogin = async(req,res,next)=>{
    try{
        if(req.session.admin_id){
            next()
        }else{
            res.redirect('/admin');
        }
    }catch(error){
        res.status(500).send('Server Error');
    }
}


const isLogout = async(req,res,next)=>{
    try{
        console.log("islogout");
        if(req.session.admin_id){
            res.redirect('/admin/home')
        }else{
            next()
        }
    }catch(error){
        res.status(500).send("Server Error");
    }
}


const jsonIsLogin =async(req,res,next)=>{
    console.log('hello')
    try {
        if(req.session.admin_id){
            console.log("jsonlogin");
            next();
        }else{
            res.status(401).send();
        }
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    isLogin,
    isLogout,
    jsonIsLogin
}