const Coupon = require("../model/couponModel");
const Cart = require("../model/cartModel");
const { Long } = require("mongodb");
const moment = require('moment');

//=================USER SIDE COUPON RELATED CONTROLLERS==================

const applyCoupon = async (req, res) => {
  try {
    console.log("reached at apply coupon");
    const couponCode = req.body.couponCode;
    const mainTotal = req.body.mainTotal;
    console.log("coupon code :",couponCode,"main totallll :",mainTotal );

    const user = req.session.user;
    const user_id = user._id;
    const currentDate = new Date();
    const couponData = await Coupon.findOne({
      couponCode: couponCode,
      expiryDate: { $gte: currentDate },
      is_blocked: false,
    });
    console.log("coupon data ;",couponData);
    if(couponData === null){
      res.json({coupon:false})
    }
    const exist = couponData.usedUsers.includes(user_id);
    console.log("jsut shw me the coupon data :", couponData);
    if (!exist) {
      console.log("entered inside the !exist");
      const exstingCart = await Cart.findOne({ userId: user_id });
      if (exstingCart && exstingCart.couponDiscount == null && couponData.discount <= mainTotal) {
        await Coupon.findOneAndUpdate(
          { couponCode: couponCode },
          { $push: { usedUsers: user_id } }
        );
        await Cart.findOneAndUpdate(
          { userId: user_id },
          { $set: { couponDiscount: couponData._id } }
        );

        console.log("finally it is true now ");
        res.json({ coupon: true });
      } else if(couponData.discount > mainTotal){
        res.json({coupon:"You cant use this coupon ,please buy more"})
      }else [res.json({ coupon: "already applied" })];
    } else {
      res.json({ coupon: "already used" });
    }
  } catch (error) {
    console.log("error on apply coupon :", error);
  }
};

const removeCoupon = async (req, res) => {
  try {
    console.log("req. body remove coupon : ", req.body);
    const couponCode = req.body.couponCode;
    const user = req.session.user;
    const userId = user._id;
    console.log("user Id :", userId);

    const couponData = await Coupon.findOne({ couponCode: couponCode });

    await Coupon.findOneAndUpdate(
      { couponCode: couponCode },
      { $pull: { usedUsers: userId } }
    );
    const updatedCart = await Cart.findOneAndUpdate(
      { userId: userId },
      { $set: { couponDiscount: null } }
    );

    res.json({ success: true });
  } catch (error) {
    console.error("error on remove coupon , resolve it immediately:", error);
  }
};

//=================ADMIN SIDE COUPON CONTROLLER========================

const viewCoupon = async (req, res) => {
  console.log("outside of the coupon ");
  try {
    let page = req.query.page || 1;
    const limit = 3; 
    const coupon = await Coupon.find({})
    .limit(limit*1)
    .skip((page-1)*limit)
    .exec();
    const count = await Coupon.find().countDocuments()
    res.render("admin/coupon", { coupon ,moment,totalPages:Math.ceil(count/limit),currentPage:page});

  } catch (error) {
    console.log("error on coupon :", error);
  }
};

const addCoupon = async (req, res) => {
  console.log("outside of the add coupon");
  try {
    console.log("details from the req.body :", req.body.activationDate);
    const couponData = await Coupon.findOne({
      couponCode: req.body.couponCode,
    });
    if (couponData) {
      console.log("existing ");
      res.json({ message: "Coupon already exists!!", success: false });
    } else {
      const data = new Coupon({
        name: req.body.couponName,
        couponCode: req.body.couponCode,
        discount: req.body.discount,
        criteriaAmount: req.body.criteriaAmount,
        activationDate: req.body.activationDate,
        expiryDate: req.body.expiryDate,
      });
      await data.save();
      console.log("successsssss");
      res.json({ data, success: true });
    }
  } catch (error) {
    console.log("error on addcoupon get :", error);
    res.render("user/500"); // You might want to handle this error differently
  }
};

const updateCouponSatus = async (req, res) => {
  try {
    console.log("req body ;", req.body);
    const couponAction = req.body.couponAction;
    const couponId = req.body.couponId;
    const currentDate = new Date();

    // Find coupons with expiration dates in the past
    const expiredCoupons = await Coupon.find({ expiryDate: { $lt: currentDate }, is_blocked: false });
    console.log("expired Coupon :",expiredCoupons);
    // Block expired coupons
    await Promise.all(expiredCoupons.map(async coupon => {
      coupon.is_blocked = true;
      await coupon.save();
    }));


    if (couponAction == "Block") {
      await Coupon.findOneAndUpdate(
        { _id: couponId },
        { $set: { is_blocked: true } }
      );
    } else {
      console.log("coupon action :", couponAction);
      console.log("in else condition");
      await Coupon.findOneAndUpdate(
        { _id: couponId },
        { $set: { is_blocked: false } }
      );
    }
    console.log("update coupon status ile tthi");
    res.json({ success: true });
  } catch (error) {
    console.log("error on update coupon status: ", error);
  }
};

const deleteCoupon = async (req, res) => {
  try {
    const couponId = req.body.couponId;
    await Coupon.deleteOne({ _id: couponId });
    console.log("thisis coupon id :", couponId);
    res.json({ success: true });
  } catch (error) {
    console.error("error on delete Coupon :", error);
  }
};

module.exports = {
  viewCoupon,
  addCoupon,
  updateCouponSatus,
  deleteCoupon,
  applyCoupon,
  removeCoupon,
};
