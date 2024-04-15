const Cart = require("../model/cartModel");
const User = require("../model/userModel");
const Product = require("../model/productModel");
const Coupon = require("../model/couponModel");
const Wishlist = require("../model/wishlistModel");

const viewCart = async (req, res) => {
  try {
    const user = req.session.user;
    const userId = user._id;
    console.log("user id :", userId);
    const userData = await User.findById({ _id: userId });
    console.log("user Data from view cart :", userData);
    const cart = await Cart.findOne({ userId })
      .populate({
        path: "items.productId",
        populate: {
          path: "category",
          populate: {
            path: "offer",
          },
        },
        populate: {
          path: "offer",
        },
      })
      .exec();

    console.log(cart, "tihs is it ");
    console.log("the blocked status :", userData.blocked);
    if (userData.blocked === 1) {
      console.log("entered to this ");
      req.session.destroy();
      res.redirect("/user-blocked");
    } else {
      console.log("entered to this else case ");
      if (cart) {
        const cartItems = cart.items;
        res.render("user/cart", { cartItems, user, cart });
      } else {
        console.log("asuuuuuuuuuuui");
        const cartItems = null;
        res.render("user/cart", { user, cart, cartItems });
      }
    }
  } catch (error) {
    console.log("error on view cart :", error.message);
  }
};

const postToCart = async (req, res) => {
  try {
    const user = req.session.user;
    const productID = await req.body.productId;
    const productData = await Product.findOne({ _id: productID });
    const userCart = await Cart.findOne({ userId: user._id });

    let productPrice = productData.discountedPrice
      ? productData.discountedPrice
      : productData.price;

    if (!productData) {
      return res.status(404).json({
        status: "failed",
        message: "product not found!",
      });
    }

    if (productData.isBlocked === 0) {
      return res.status(404).json({
        status: "failed",
        message: "product currently unavailable",
      });
    }

    if (!userCart) {
      const newCart = new Cart({
        userId: user._id,
        items: [
          {
            productId: productID,
            quantity: 1,
            price: productPrice,
            totalPrice: productPrice,
          },
        ],
      });

      const cartSave = await newCart.save();

      if (cartSave) {
        const cartCount = cartSave.items.length;
        return res.status(201).json({
          status: "success",
          cartCount,
          value: 0,
          message: "product added to cart succefully",
        });
      }
    }

    const exist = userCart.items.find((item) => {
      return item.productId.equals(productID);
    });

    if (!exist) {
      const updatedCart = await Cart.findOneAndUpdate(
        { userId: user._id },
        {
          $push: {
            items: {
              productId: productID,
              quantity: 1,
              price: productPrice,
              totalPrice: productPrice,
            },
          },
        },

        { new: true }
      );

      if (updatedCart) {
        const count = updatedCart.items.length;
        return res.status(200).json({
          status: "success",
          value: 0,
          message: "product added successfully",
        });
      }
    }
    return res.status(409).json({ value: 1, message: "item already exists" });
  } catch (error) {
    console.log("error on post to cart ", error);
  }
};

const deleteFromCart = async (req, res) => {
  try {
    const userID = req.session.user._id;
    const combinedId = req.body.productId;
    const [productId, quantity] = combinedId.split(",");
    const cartItem = await Cart.findOne({
      userId: userID,
      "items.productId": productId,
    });

    if (!cartItem) {
      return res.status(404).json({ error: "Item not found in the cart" });
    }
    const product = cartItem.items.find((item) => item.productId == productId);
    const updatedCart = await Cart.findOneAndUpdate(
      { userId: userID },
      {
        $pull: {
          items: {
            productId,
          },
        },
      },
      {
        new: true,
      }
    );

    res.json({ updatedCart, productId });
  } catch (error) {
    console.log("Error on delete Cart:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateCartQuantity = async (req, res) => {
  try {
    console.log("clicked clicked");
    const product_id = req.body.data.productId;
    const user = req.session.user;
    const user_id = user._id;
    const count = req.body.data.count;

    const cartData = await Cart.findOne({ userId: user_id });
    const product = cartData.items.filter((obj) => obj.productId == product_id);
    const productData = await Product.findById(product_id);
    console.log("step 1");
    console.log("product . quantity :", product[0].quantity);
    if (
      (product[0].quantity >= 1 &&
        count > 0 &&
        product[0].quantity < productData.quantity) ||
      (product[0].quantity >= 2 && count < 0)
    ) {
      const cartData = await Cart.findOneAndUpdate(
        { userId: user_id, "items.productId": product_id },
        { $inc: { "items.$.quantity": count } },
        { new: true }
      );

      console.log("step 2");
      const item = cartData.items.find((item) => item.productId == product_id);

      let totalAmount;
      if (item) totalAmount = item.quantity * item.price;

      console.log("step 3");

      await Cart.findOneAndUpdate(
        { userId: user_id, "items.productId": product_id },
        { $set: { "items.$.totalPrice": totalAmount } }
      );

      const cartTotal = cartData.items.reduce((total, item) => {
        return total + item.quantity * item.price;
      }, 0);
      res.json({ stock: true, cartTotal });
    } else {
      if (product[0].quantity > 1) {
        console.log("step 4");
        res.json({ stock: false });
      } else {
        console.log("step 4");
        res.json({ stock: true });
      }
    }
  } catch (error) {
    console.log(error.message);
    res.render("user/500");
  }
};

const loadCheckOut = async (req, res) => {
  try {
    const user = req.session.user;

    const user_id = user._id;
    const walletBalance = await User.findOne({ _id: user_id });
    const cartData = await Cart.findOne({ userId: user_id })
      .populate("items.productId")
      .populate("couponDiscount");
    const currentDate = new Date();
    let discountTotal = 0;
    if (cartData) {
      let addressData = await User.findOne({ _id: user_id }, { address: 1 });
      addressData =
        addressData == null
          ? { user: user_id, _id: 1, address: [] }
          : addressData;

      const subTotal = cartData.items.reduce((acc, val) => {
        return acc + val.totalPrice;
      }, 0);
      //total is temporaryy !!
      if (cartData.couponDiscount) {
        const discount = cartData.couponDiscount.discount;
        discountTotal = subTotal - discount;
      } else {
        discountTotal = subTotal;
      }
      const coupon = await Coupon.find({
        expiryDate: { $gte: currentDate },
        is_blocked: false,
      });
      const eligibleCoupons = coupon.filter(
        (coupon) => subTotal >= coupon.criteriaAmount
      );
      console.log("eligible coupon :", eligibleCoupons);
      const stock = cartData.items.filter((item) => item.quantity > 0);

      res.render("user/checkoutPage", {
        address: addressData,
        cart: cartData,
        user: user_id,
        subTotal: subTotal,
        total: discountTotal,
        coupon: eligibleCoupons,
        stock: stock,
        wallet: walletBalance,
      });
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.log("erro on load check out :", error);
    res.status(500).render("user/500");
  }
};

//===================WISHLIST RELATED==========================

const getWishlist = async (req, res) => {
  try {
    console.log("entered to show wishlist ");
    const user = req.session.user;
    const userId = user._id;
    const userData = await User.findById({ _id: userId });
    const wishlist = await Wishlist.findOne({ user: userId })
      .populate({
        path: "product.productId",
        select: "name price images quantity",
      })
      .exec();

    console.log("wishlist:", wishlist);
    if (userData.blocked === 1) {
      req.session.destroy();
      res.redirect("/user-blocked");
    } else {
      if (wishlist && wishlist.product.length > 0) {
        const wishlistData = wishlist.product;
        res.render("user/wishlist", { user, wishlist, wishlistData });
      } else {
        res.render("user/wishlist", { user, wishlist, wishlistData: [] });
      }
    }
  } catch (error) {
    // Handle error appropriately
    res.status(500).send("Internal Server Error");
  }
};

const addToWishlist = async (req, res) => {
  try {
    console.log("Adding to wishlist");
    const productId = req.body.productId;
    const user = req.session.user;
    const userId = user._id;

    const wishlistData = await Wishlist.findOne({
      user: userId,
      "product.productId": productId,
    });

    if (wishlistData) {
      console.log("Product already exists in wishlist");
      await Wishlist.findOneAndUpdate(
        { user: userId },
        { $pull: { product: { productId: productId } } }
      );
      res.json({ add: false, productId: productId });
    } else {
      const productData = {
        productId: productId,
      };
      await Wishlist.findOneAndUpdate(
        { user: userId },
        { $addToSet: { product: productData } },
        { upsert: true, new: true }
      );

      console.log("Product added to wishlist");
      res.json({ add: true, productId: productId });
    }
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    res.status(500).render("user/500");
  }
};

const deleteWishlist = async (req, res) => {
  console.log("entered to delete wishlist ");
  let productId = req.body.productId;
  console.log("product id ", productId);
  const user = req.session.user;
  const userId = user._id;
  const wishlistData = await Wishlist.findOne({
    user: userId,
    "product.productId": productId,
  });
  console.log("wishlist data :", wishlistData);
};

module.exports = {
  viewCart,
  postToCart,
  deleteFromCart,
  updateCartQuantity,
  loadCheckOut,
  addToWishlist,
  getWishlist,
};
