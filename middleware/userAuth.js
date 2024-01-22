
const checkBlock = require('../utilities/checkBlock')
const isLogin = async(req,res,next)=>{
    try{
        if(req.session.user){
            next();
        }else{
            res.redirect('/login')
        }
    }catch(error){
        res.render('500');
    }
}


const isLogout = async(req,res,next)=>{
    try{
        if(req.session.user){
            res.redirect('/');
        }else{
            next();
        }
    }catch(error){
        console.log("ivdenoooo");
        res.render('500')
    }
}


const userBlock = async(req,res,next)=>{
    try {
        if(req.session.user){
            if(req.session.blocked === 0){
                user = req.session.user;
                next();
            }
            if(await checkBlock(req.session.mail)){
                req.session.destroy();
                res.redirect('/user-blocked')
            }else{
                next();
            }
        }else{
            next();
        }
    } catch (error) {
        console.log(error.message);
    }
}


module.exports = {
    isLogin,
    isLogout,
    userBlock
}