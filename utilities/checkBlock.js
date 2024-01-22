const User = require('../model/userModel');
const checkBlock = async (userId) =>{
    try {
        console.log(userId);
        const userData = await User.findById({mail:userId});
        console.log(userData)
        return userData.blocked
    } catch (error) {
       console.log(error); 
       return error
    }
}

module.exports = checkBlock