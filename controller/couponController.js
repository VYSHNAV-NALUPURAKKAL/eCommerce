const Coupon = require("../model/couponModel");
const Cart = require("../model/cartModel");
const { Long } = require("mongodb");

//=================USER SIDE COUPON RELATED CONTROLLERS==================

const applyCoupon = async (req, res) => {
  try {
    console.log("reached at apply coupon");
    const couponCode = req.body.couponCode;
    console.log("coupon code :",couponCode);

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
      if (exstingCart && exstingCart.couponDiscount == null) {
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
      } else [res.json({ coupon: "already applied" })];
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
    const coupon = await Coupon.find({});
    res.render("admin/coupon", { coupon });
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
