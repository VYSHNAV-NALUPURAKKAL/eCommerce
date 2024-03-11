const { ObjectId } = require("mongodb");
const User = require("../model/userModel");

const loadAddAddress = async (req, res) => {
  console.log(" outside load address ");
  try {
    const user = req.session.user;

    res.render("user/addAddress", { user });
  } catch (error) {
    console.log("error on Load Add Address :", error);
    res.render("user/500");
  }
};

const addAddress = async (req, res) => {
  try {
    console.log("entranceeeeeeee");
    const user = req.session.user;
    console.log("req body", req.body);
    const { name, mobile, email, house, state, city, pincode } = req.body;
    console.log("user id :", user._id);
    await User.findOneAndUpdate(
      { _id: user._id },
      {
        $push: {
          address: {
            fullName: name,
            mobile: mobile,
            email: email,
            houseName: house,
            state: state,
            city: city,
            pin: pincode,
          },
        },
      },
      { new: true }
    );

    const referer = req.headers.referer;
    const isCheckoutPage = referer && referer.includes("/checkout");
    console.log("referer :", referer, "ischeckout page :", isCheckoutPage);
    if (isCheckoutPage) {
      res.json({ message: "success" });
    } else {
      res.redirect("/profile#tabaddress");
    }
  } catch (error) {
    console.log("add address :", error);
  }
};

const deleteAddress = async (req, res) => {
  try {
    console.log("delete Address", req.params);
    const user = req.session.user;
    const addressId = req.params.id;
    await User.updateOne(
      { _id: user._id },
      {
        $pull: {
          address: {
            _id: addressId,
          },
        },
      }
    );
    res.redirect("/profile#tab-address");
  } catch (error) {
    console.log("error on deleteAddress :", error);
  }
};

const showEditAddress = async (req, res) => {
  try {
    const userData = req.session.user;
    const ind = req.query.ind;

    // Find the user and populate the 'address' field
    const user = await User.findOne({ _id: userData._id });

    if (
      !user ||
      !Array.isArray(user.address) ||
      ind < 0 ||
      ind >= user.address.length
    ) {
      return res.render("user/500");
    }

    const address = user.address[ind];

    res.render("user/editAddress", { user, edit: address });
  } catch (error) {
    console.log("error on show edit address :", error);
    res.render("user/500");
  }
};

const editAddress = async (req, res) => {
  try {
    const user = req.session.user;
    const addressId = req.body;
    console.log("addressId", addressId);

    const result = await User.updateOne(
      {
        _id: user._id,
        "address._id": addressId,
      },
      {
        $set: {
          "address.$.fullName": req.body.name,
          "address.$.mobile": req.body.mobile,
          "address.$.email": req.body.email,
          "address.$.houseName": req.body.house,
          "address.$.state": req.body.state,
          "address.$.city": req.body.city,
          "address.$.pin": req.body.pincode,
        },
      }
    );

    res.redirect("/profile#tab-address");
  } catch (error) {
    console.log("Error on edit Address:", error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  loadAddAddress,
  addAddress,
  deleteAddress,
  showEditAddress,
  editAddress,
};
