const User = require("../model/userModel");
const bcrypt = require("bcrypt");
const randomstring = require("randomstring");
const Order = require("../model/orderModel");
const Product = require("../model/productModel");
const Category = require("../model/categoryModel")
const moment = require("moment");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");
const puppeteer = require("puppeteer");
const puppeteerpdf = require("pdf-puppeteer");
const path = require("path");
const ejs = require("ejs");
require("dotenv").config();

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.error(error.message);
  }
};

const loadLogin = async (req, res) => {
  try {
    console.log("loadlogin");
    res.render("admin/adminLogin", {
      message: "Enter Your Email and Password",
    });
  } catch (error) {
    console.error(error, "An Error on Admin Login");
  }
};

const loadLogout = async (req, res) => {
  console.log("load logout daaa", "adminn :", req.session.admin_id);
  try {
    req.session.admin_id = false;
    res.redirect("/admin");
  } catch (error) {
    console.error("error on load logout :", error);
  }
};

const verifyLogin = async (req, res) => {
  try {
    console.log("verify login");
    const email = req.body.email;
    const password = req.body.password;
    console.log(email, password);

    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASS
    ) {
      req.session.admin_id = "admin_og";
      res.redirect("admin/home");
    } else {
      return res.render("admin/adminLogin", {
        message: "Email and Pass word do not match",
      });
    }
  } catch (error) {
    console.error(error, "an error occurd on admin verify");
  }
};
const logout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/admin");
  } catch (error) {
    console.log(error.message);
  }
};

// DASHBOARD OF ADMIN

const loadHome = async (req, res) => {
  try {
    const userCount = await User.countDocuments({ is_verified: true });
    const averageUsers = userCount / 8;

   
    let iconClass = "mdi mdi-arrow-bottom-left";
    if (averageUsers >= 1) {
      iconClass = "mdi mdi-arrow-top-right";
    }
    console.log("req.session.asdmin id : ", req.session.admin_id);
    const userData = req.session.admin_id;

    const revenueResult = await Order.aggregate([
      { $match: { orderStatus: "delivered" } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$subTotal" },
        },
      },
    ]);

    const totalRevenue =
      revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayShippedOrders = await Order.find({
      orderDate: { $gte: today },
      orderStatus: "delivered",
    }).populate("products.productId");

  
    let dailyIncome = 0;
    todayShippedOrders.forEach((order) => {
      if (order.orderDate.getDate() === today.getDate()) {
        dailyIncome += order.totalAmount;
      }
    });


    const pendingOrdersCount = await Order.countDocuments({
      orderStatus: "pending",
    });


    const paymentMethodCounts = await Order.aggregate([
      { $match: { orderStatus: "delivered" } },
      {
        $group: {
          _id: "$payment",
          count: { $sum: 1 },
        },
      },
    ]);

    const paymentMethods = {};
    paymentMethodCounts.forEach((method) => {
      console.log("entahan mehtod.count :", method.count);
      console.log("entahaan method.id :", method._id);
      if (method._id === "Razorpay") {
        paymentMethods.OnlinePayment = method.count;
      } else if (method._id === "Cash On Delivery") {
        paymentMethods.CashOnDelivery = method.count;
      }else{
        paymentMethods.Wallet = method.count;
      }
    });

    let orders = [];
    if (req.query.startDate && req.query.endDate) {

      orders = await Order.find({
        orderDate: {
          $gte: new Date(req.query.startDate),
          $lte: new Date(req.query.endDate),
        },
      })
        .populate("user", "name")
        .populate("products.productId", "name  quantity")
    }

    const startDate = req.query.startDate || "";
    const endDate = req.query.endDate || "";

    const shippedOrdersToday = await Order.find({
      orderDate: { $gte: today },
      orderStatus: "delivered",
    });

    const amountsCollectedToday = [];
    let runningTotal = 0;
    shippedOrdersToday.forEach((order) => {
      if (order.orderDate.getDate() === today.getDate()) {
        runningTotal += order.subTotal;
        amountsCollectedToday.push(runningTotal);
      }
    });

    const ordersGroupedByDay = shippedOrdersToday.reduce((acc, order) => {
      const orderDate = order.orderDate.toISOString().split("T")[0];
      if (!acc[orderDate]) {
        acc[orderDate] = {
          totalAmount: 0,
          orderCount: 0,
        };
      }
      acc[orderDate].totalAmount += order.subTotal;
      acc[orderDate].orderCount++;
      return acc;
    }, {});

    const labels = Object.keys(ordersGroupedByDay);
    const amounts = labels.map((date) => ordersGroupedByDay[date].totalAmount);
    const orderCounts = labels.map(
      (date) => ordersGroupedByDay[date].orderCount
    );
    /////////////////////////////////////////////////////
    const topSoldProducts = await Order.aggregate([
      { $match: { orderStatus: "delivered" } },
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.productId",
          totalSold: { $sum: "$products.quantity" },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 6 },
    ]);

    /////////////////////////////////////////////////////
    const topSoldCategories = await Order.aggregate([
      { $match: { orderStatus: "delivered" } },
      { $unwind: "$products" },
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      { $unwind: "$productDetails" },
      {
        $lookup: {
          from: "categories",
          localField: "productDetails.category",
          foreignField: "_id",
          as: "categoryDetails"
        }
      },
      { $unwind: "$categoryDetails" },
      {
        $group: {
          _id: "$categoryDetails.categoryName",
          totalSold: { $sum: "$products.quantity" }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 6 }
    ]);
    
    const categorySoldCount = topSoldCategories.map((category)=>category.totalSold) 
    const categoryName =  topSoldCategories.map((category)=>category._id)
    const topCategoryNames = await Category.find(
      {categoryName:{$in:categoryName}},
      "categoryName"
    )      
    const productIds = topSoldProducts.map((product) => product._id);
    const soldQuantities = topSoldProducts.map((product) => product.totalSold);
    const topProductNames = await Product.find(
      { _id: { $in: productIds } },
      "name"
    );

    const currentYear = new Date().getFullYear();
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const monthlySales = [];

    for (let i = 0; i < 12; i++) {
      const startDate = new Date(currentYear, i, 1);
      const endDate = new Date(currentYear, i + 1, 0);

      const result = await Order.aggregate([
        {
          $match: {
            orderDate: { $gte: startDate, $lte: endDate },
            orderStatus: "delivered",
          },
        },
        {
          $group: {
            _id: null,
            productsSold: { $sum: { $size: "$products" } },
          },
        },
      ]);

      const productsSold = result.length > 0 ? result[0].productsSold : 0;
      monthlySales.push({ month: monthNames[i], productsSold });
    }

    console.log("monthly saless s at last :", monthlySales,"amountssssssssssssssssss ;",amounts,"labelsssssss");

    res.render("admin/home", {
      admin: userData,
      userCount,
      averageUsers,
      totalRevenue,
      iconClass,
      pendingOrdersCount,
      dailyIncome,
      paymentMethods,
      orders,
      startDate,
      endDate,
      amountsCollectedToday: JSON.stringify(amountsCollectedToday),
      labels: JSON.stringify(labels),
      amounts: JSON.stringify(amounts),
      orderCounts: JSON.stringify(orderCounts),
      topProductNames: topProductNames,
      soldQuantities: soldQuantities,
      categorySoldCount:categorySoldCount,
      topCategoryNames:topCategoryNames,
      monthlySales: JSON.stringify(monthlySales),
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

// ==============================================
const seeCustomers = async (req, res) => {
  try {
    let search = "";
    if (req.query.search) {
      search = req.query.search;
    }

    const customers = await User.find({
      $or: [
        {
          name: { $regex: ".*" + search + ".*", $options: "i" },
        },
        {
          email: { $regex: ".*" + search + ".*", $options: "i" },
        },
        {
          phone: { $regex: ".*" + search + ".*" },
        },
      ],
    });

    res.render("admin/customers", { customers, search });
  } catch (error) {
    console.log(error);
  }
};

const updateCustomers = async (req, res) => {
  try {
    console.log("updatecustomersss");
    const userData = await User.findByIdAndUpdate(
      { _id: req.params.id },
      { $bit: { blocked: { xor: 1 } } },
      { new: true }
    );
    if (userData) {
      const message = userData.blocked ? "Unblock" : "Block";
      res.json({ message });
    }
  } catch (error) {
    console.log(error.message);
  }
};

// ==================================================

const Sales = async (req, res) => {
  const startDate = req.body.startDate;
  const endDate = req.body.endDate;
  const selectedvalue = req.body.selectedvalue;
  try {
    if (selectedvalue === "Daily") {
      console.log("entered to daily");
      const orderData = await Order.aggregate([
        {
          $match: {
            orderStatus: "delivered",
            $expr: {
              $eq: [
                {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$orderDate",
                  },
                },
                {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: new Date(),
                  },
                },
              ],
            },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "userData",
          },
        },
        {
          $unwind: "$products",
        },
        {
          $lookup: {
            from: "products",
            localField: "products.productId",
            foreignField: "_id",
            as: "productData",
          },
        },
      ]);

      res.json({ orderData });
    } else if (selectedvalue === "Weekly") {
      const startDateOfWeek = new Date();
      startDateOfWeek.setDate(startDateOfWeek.getDate() - startDateOfWeek.getDay()); // Set to the beginning of the current week (Sunday)
    
      const endDateOfWeek = new Date();
      endDateOfWeek.setDate(endDateOfWeek.getDate() + (6 - endDateOfWeek.getDay())); // Set to the end of the current week (Saturday)
    
      const orderData = await Order.aggregate([
        {
          $match: {
            orderStatus: "delivered",
            orderDate: {
              $gte: startDateOfWeek,
              $lte: endDateOfWeek
            }
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "userData",
          },
        },
        {
          $unwind: "$products",
        },
        {
          $lookup: {
            from: "products",
            localField: "products.productId",
            foreignField: "_id",
            as: "productData",
          },
        },
      ]);
    
      res.json({ orderData });
    } else if (selectedvalue === "Monthly") {
      console.log("inside of monthly ");
      const orderData = await Order.aggregate([
        {
          $match: {
            orderStatus: "delivered",
            $expr: {
              $eq: [
                {
                  $month: "$orderDate",
                },
                {
                  $month: new Date(),
                },
              ],
            },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "userData",
          },
        },
        {
          $unwind: "$products",
        },
        {
          $lookup: {
            from: "products",
            localField: "products.productId",
            foreignField: "_id",
            as: "productData",
          },
        },
      ]);

      res.json({ orderData });
    } else if (selectedvalue === "Yearly") {
      console.log("inside of yearly ");
      const orderData = await Order.aggregate([
        {
          $match: {
            orderStatus: "delivered",
            $expr: {
              $eq: [
                {
                  $year: "$orderDate",
                },
                {
                  $year: new Date(),
                },
              ],
            },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "userData",
          },
        },
        {
          $unwind: "$products",
        },
        {
          $lookup: {
            from: "products",
            localField: "products.productId",
            foreignField: "_id",
            as: "productData",
          },
        },
      ]);
      res.json({ orderData });
    } else if (selectedvalue === "Custom Date") {
      console.log("inside of custom date :");
      const orderData = await Order.aggregate([
        {
          $match: {
            orderStatus: "delivered",
            orderDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "userData",
          },
        },
        {
          $unwind: "$products",
        },
        {
          $lookup: {
            from: "products",
            localField: "products.productId",
            foreignField: "_id",
            as: "productData",
          },
        },
      ]);

      res.json({ orderData });
    } else if (selectedvalue === "ALL") {
      console.log("inside of allllll");
      const orderData = await Order.aggregate([
        {
          $match: {
            orderStatus: "delivered",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "userData",
          },
        },
        {
          $unwind: "$products",
        },
        {
          $lookup: {
            from: "products",
            localField: "products.productId",
            foreignField: "_id",
            as: "productData",
          },
        },
      ]);

      res.json({ orderData });
    } else {
      console.log("inside of else ");
      const orderData = await Order.aggregate([
        {
          $match: {
            orderStatus: "delivered",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "userData",
          },
        },
        {
          $unwind: "$products",
        },
        {
          $lookup: {
            from: "products",
            localField: "products.productId",
            foreignField: "_id",
            as: "productData",
          },
        },
        {
          $match: {
            productData: { $ne: [] },
            userData: { $ne: [] },
          },
        },
      ]);
      console.log("ordre data from else condition ;", orderData);
      res.render("admin/sales", { orderData });
    }
  } catch (error) {
    console.log("error on sales :", error.message);
  }
};

const salesReport = async (req, res) => {
  const orderDatas = await Order.aggregate([
    {
      $match: {
        orderStatus: "placed",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "userData",
      },
    },
    {
      $unwind: "$products",
    },
    {
      $lookup: {
        from: "products",
        localField: "products.productId",
        foreignField: "_id",
        as: "productData",
      },
    },
    {
      $match: {
        productData: { $ne: [] },
        userData: { $ne: [] },
      },
    },
  ]);

  const selectedformat = req.body.selectedformat;
  const startDate = req.body.startDate;
  const endDate = req.body.endDate;

  if (selectedformat === "PDF") {
    try {
      const orderData =
        req.body.datas !== undefined && req.body.datas.length !== 0
          ? req.body.datas
          : orderDatas;

      const ejsPagePath = path.join(__dirname, "../view/admin/report.ejs");
      const ejsPage = await ejs.renderFile(ejsPagePath, { orderData });

      const browser = await puppeteer.launch({ headless: "new" });
      const page = await browser.newPage();
      await page.setContent(ejsPage);
      const pdfBuffer = await page.pdf();
      await browser.close();

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=invoice.pdf");
      res.send(pdfBuffer);
    } catch (error) {
      console.log("error on sales report generating :", error);
    }
  } else {
    try {
      const orderData =
        req.body.datas !== undefined && req.body.datas.length !== 0
          ? req.body.datas
          : orderDatas;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Sales Report");

      worksheet.addRow([
        "NO",
        "ID",
        "PRODUCT NAME",
        "QUANTITY SOLD",
        "PRICE",
        "TOTTEL SALES",
        "ORDER DATE",
        "CUSTOMER",
        "PAYMENT METHODE",
      ]);

      orderData.forEach((order, index) => {
        worksheet.addRow([
          index + 1,
          order.orderId,
          order.productData[0] ? order.productData[0].name : "",
          order.products.count,
          order.products.price,
          order.products.totalPrice,
          order.orderDate.toString().slice(-4)
            ? order.orderDate.toString().slice(0, 10)
            : "",
          order.userData[0].email,
          order.payment,
        ]);
      });

      const buffer = await workbook.xlsx.writeBuffer();

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=sales_report.xlsx"
      );
      res.send(buffer);
    } catch (error) {
      console.log(error);
    }
  }
};

module.exports = {
  securePassword,
  loadLogin,
  verifyLogin,
  loadHome,
  seeCustomers,
  updateCustomers,
  loadLogout,
  Sales,
  salesReport,
};
