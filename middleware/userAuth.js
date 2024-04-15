
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
            console.log("no worry");
            res.redirect('/');
        }else{
            console.log("appo ivdee");
            next();
        }
    }catch(error){
        console.log("ivdenoooo");
        res.render('500')
    }
}



const userBlock = async (req, res, next) => {
    try {
        console.log("enteredddddddddd");
        const user = req.session.user;
        console.log("user :",user,"req.seesion.user :",req.session.user);
        if (user) {
            if (user.blocked === 0) {
                console.log("poyiiiiiiiiiiiii");
                next();
            } else {
                console.log("appo blocked");
                const isBlocked = await checkBlock(user.email); 
                if (isBlocked) {
                    console.log("destroyeddddddddd");
                    req.session.destroy();
                    return res.redirect('/user-blocked');
                }
            }
        }
        next();
    } catch (error) {
        console.log(error.message);
        next("error on user block :",error); 
    }
}



module.exports = {
    isLogin,
    isLogout,
    userBlock
}