const Cart = require("../model/cartModel");
const Product = require("../model/productModel");
const User = require("../model/userModel");
const Order = require("../model/orderModel");
const Razorpay = require("razorpay");
const crypto = require("crypto"); 
require("dotenv").config();

var instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});



const checkoutPost = async (req, res) => {
  try {
    const user = req.session.user;
    const userId = user._id;
    const selectedAddress = req.body.selectedAddress;
    const paymentMethod = req.body.selectedPaymentMethod;
    const totalCheckoutAmount = req.body.totalValue;
    const cartData = await Cart.findOne({ userId: userId }).populate('couponDiscount')

    const userAddress = await User.findOne({
      _id: userId,
      "address._id": selectedAddress,
    });
    console.log("payment method :", paymentMethod);
    console.log("selected address  :", selectedAddress);
    console.log("cart data from checkout post  :", cartData);
    console.log("cart data . coupondiscount :",cartData.couponDiscount);
    const address = userAddress.address.filter(
      (addr) => addr._id.toString() === selectedAddress
    );

      let status = paymentMethod == "Cash On Delivery" ? "placed" : "pending";
      const orderItems = [];

      
    for (const product of cartData.items) {
      const { productId, quantity, price, totalPrice } = product;
      const productData = await Product.findOne({ _id: productId });
      if (quantity > 0 && quantity <= productData.quantity) {
        productData.quantity -= quantity;
        await productData.save();
      }

      for(let i = 0 ; i <quantity ; i++){
        const item = {
          productId,
          quantity:1,
          price:price,
          totalPrice:price,
          productStatus:status,
        }
      

      if(cartData.couponDiscount){

        const totalQuantity = cartData.items.reduce((total,product)=> total + product.quantity,0);
        const discountPerItem = cartData.couponDiscount.discount / totalQuantity;
        item.totalPrice = price - discountPerItem;

      }else{
        item.totalPrice = price;
      }
      orderItems.push(item);
    }
  }
      const total = orderItems.reduce((acc,item)=>acc + item.totalPrice,0);
      const totalAmount = total;  

      if (status) {
        const newOrder = new Order({
          user: userId,
          deliveryAddress: address,
          payment: paymentMethod,
          products:orderItems,
          subTotal: totalAmount,
          orderStatus: status,
          orderDate: new Date(),
        });

        const orderSave = await newOrder.save();
        await cartData.deleteOne({ userId: userId });
        console.log("saved order save in checkout post :", orderSave);

        if (orderSave && paymentMethod === "Cash On Delivery") {
          const orderId = orderSave._id;
          const totalAmount = orderSave.subTotal;
          return res.status(201).json({
            status: "success",
            orderId,
            totalAmount,
            value: 0,
            message: "order placed succefully",
          });
        } else{
          const orderId = orderSave._id;
          const totalAmount = orderSave.subTotal;
          
          let options = {
            amount: totalAmount*100,
            currency: "INR",
            receipt: "" + orderId,
          };
          
          console.log("angane options kazhinjj ");
          instance.orders.create(options, function (err, orderSave) {
            if (err) {
              console.log("error on right after options :", err);
            }
            console.log("order save :", orderSave);
            return res.status(201).json({
              status: "failed",
              orderId,
              totalAmount,
              orderSave,
              value: 0,
              message: "going with status as failed to frontend",
            });
          });
        }
    }
  } catch (error) {
    console.log("error on checkout post :", error);
  }
};



const verifyPayment = async (req, res) => {
  try {
    console.log("verify payment backendiletthi ");
    const user = req.session.user;
    const userId = user._id;
    console.log("req . body  :", req.body);
    const Data = req.body;
    const cartData = await Cart.findOne({ userId: userId });

    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(Data.razorpay_order_id + "|" + Data.razorpay_payment_id);
    const hmacValue = hmac.digest("hex");
    console.log("hamaaac hmachhhhh hmacccccc");
    if (hmacValue == Data.razorpay_signature) {
      for (const Data of cartData.items) {
        const { productId, quantity } = Data;
        await Product.updateOne(
          { _id: productId },
          { $inc: { quantity: -quantity } }
        );
      }
    }
    const newOrder = await Order.findByIdAndUpdate(
      { _id: Data.order.receipt },
      { $set: { orderStatus: "placed" } }
    );
    newOrder.products.forEach((product) => {
      product.productStatus = "placed";
    });
    console.log("new order onew order new order rrrrrrrrrrrrrr");

    await Order.findByIdAndUpdate(
      { _id: newOrder._id },
      { $set: { products: newOrder.products } },
      { new: true }
    );
    const orderId = await newOrder._id;
    res.json({ orderId, success: true });
  } catch (error) {
    console.log("erro on verifyPayment :", error);
  }
};



const successPage = async (req, res) => {
  try {
    console.log("req.query :", req.query);
    res.render("user/successPage");
  } catch (error) {
    console.log("error on success:", error);
  }
};



const detailOrder = async (req, res) => {
  try {
    const user = req.session.user;
    const user_id = user._id;
    const orderId = req.query._id;
    console.log("req.query :", req.query);
    console.log("order id :", orderId);
    const orderDetails = await Order.findById(orderId).populate(
      "products.productId"
    );
    //Sorting is done by this , latest in the top 
    console.log("order details :", orderDetails);
    res.render("user/orderDetails", { orderDetails, user });
  } catch (error) {
    console.log("error on detail order :");
  }
};



const cancelProduct = async (req, res) => {
  try {
    const productId = req.body.productId;
    const orderId = req.body.orderId;
    const user = req.session.user;
    const userId = user._id;
    const orderData = await Order.findOne({ _id: orderId });
    const productLength = orderData.products.length;
    let totalAmount = 0;

    if (productLength > 1) {
      orderData.products.forEach((item) => {
        if (item.productId == productId){
          item.productStatus = "returned or cancelled";
        }
        });

      const orderStat = orderData.products.every(
        (item) => item.productStatus === "returned or cancelled"
      );
      console.log("order stat thanneeee :", orderStat);
      if (orderStat === true) {
        await Order.updateOne(
          { _id: orderId },
          { $set: { orderStatus: "returned or cancelled" } }
        );
      } else {
        await Order.updateOne(
          {
            _id: orderId,
          },
          {
            $unwind: "products.productId",
          },
          {
            $unset: { productId: productId },
          }
        );
        await Cart.deleteOne({ _id: userId });
      }
    } else {
      orderData.orderStatus = "returned or cancelled";
      const count = orderData.products[0].quantity;
      console.log("counttttttt:", count);
      orderData.products.forEach((item) => {
        if (item.productId == productId) {
          item.productStatus = "returned or cancelled";
        }
      });
      await Product.updateOne(
        { _id: productId },
        { $inc: { quantity: count } }
      );
    }

    await orderData.save();
    res.json({ update: true, count: productLength });
  } catch (error) {
    console.log("cancel product error :", error);
  }
};

// =======================================ADMIN SIDE========================================

const loadOrderManagement = async (req, res) => {
  try {
    const user = req.session.user;
    let page = 1;
    if (req.query.page) {
      page = req.query.page;
    }
    const limit = 4;

    const orderData = await Order.find()
      .sort({orderDate:-1})
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    console.log("order data admin side : ", orderData);
    const count = await Order.find().countDocuments();
    res.render("admin/orders", {
      orders: orderData,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      user,
    });
  } catch (error) {
    console.log("error on load order managment :", error);
  }
};

const updateOrder = async (req, res) => {
  try {
    const orderStatus = req.body.status;
    const orderId = req.body.orderId;

    if (orderStatus === "returned or cancelled") {
      const orderData = await Order.findOneAndUpdate(
        { _id: orderId },
        { $set: { orderStatus: orderStatus } }
      );

      for (let i = 0; i < orderData.products.length; i++) {
        const product = orderData.products[i].productId;
        const count = orderData.products[i].quantity;
        await Product.updateOne(
          { _id: product },
          { $inc: { quantity: count } }
        );
        await Order.findOneAndUpdate(
          { _id: orderId, "products.productId": product },
          { $set: { "products.$.productStatus": orderStatus } }
        );
      }
    } else {
      const orderData = await Order.findOneAndUpdate(
        { _id: orderId },
        { $set: { orderStatus: orderStatus } }
      );
      if (orderStatus === "placed") {
        for (let i = 0; i < orderData.products.length; i++) {
          const product = orderData.products[i].productId;
          const count = orderData.products[i].quantity;
          console.log("product id ;", product);
          await Product.updateOne(
            { _id: product },
            { $inc: { quantity: -count } }
          );
          await Order.findOneAndUpdate(
            { _id: orderId, "products.productId": product },
            { $set: { "products.$.productStatus": orderStatus } }
          );
        }
      }
    }
    res.json({ update: true });
  } catch (error) {
    console.log("error on update order :", error);
  }
};

module.exports = {
  checkoutPost,
  successPage,
  detailOrder,
  loadOrderManagement,
  updateOrder,
  cancelProduct,
  verifyPayment,
};
