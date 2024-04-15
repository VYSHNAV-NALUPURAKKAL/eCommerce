const User = require('../model/userModel');
const checkBlock = async (email) =>{
    try {
        console.log("user id cnecsg :",email);
        const userData = await User.findOne({email:email});
        console.log("inside check block js : and user data :",userData)
        return userData.blocked
    } catch (error) {
       console.log(error); 
       return error
    }
}

module.exports = checkBlock