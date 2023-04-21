const express = require("express");
const GetRouter = express.Router();
const ProductSchema = require("../models/ProductSchema");
const UserSchema = require("../models/UserSchema");
const ExpenseSchema = require("../models/ExpenseSchema");
const OrderSchema = require("../models/OrderSchema");
var vendorSchema = require("../models/vendorSchema");
var PurchaseItemSchema = require("../models/PurchaseItemSchema");
const { AuthenticationMiddleware } = require("../helper/Middlewares");
const trackProducts = require("../models/trackProducts");

GetRouter.get("/products", AuthenticationMiddleware, (req, res) => {
  ProductSchema.find()
    .populate("vendorId")
    .then((dbRes) => {
      res.json(dbRes);
    });
});

GetRouter.get("/trackProducts", AuthenticationMiddleware, async (req, res) => {
  trackProducts
    .find()
    .populate("vendorId")
    .then(async (dbRes) => {
      const filterData = dbRes.filter((b) => b.stock > 0);
      res.json(filterData);
    });
});

GetRouter.get("/expenses", AuthenticationMiddleware, (req, res) => {
  ExpenseSchema.find().then((dbRes) => {
    res.json(dbRes);
  });
});

GetRouter.get("/users", AuthenticationMiddleware, (req, res) => {
  UserSchema.find().then((dbRes) => {
    res.json(dbRes);
  });
});

GetRouter.get("/orders", AuthenticationMiddleware, (req, res) => {
  OrderSchema.find().then((dbRes) => {
    res.json(dbRes);
  });
});

GetRouter.get("/order", AuthenticationMiddleware, (req, res) => {
  OrderSchema.findOne({ _id: req.query.id }).then((dbRes) => {
    res.json(dbRes);
  });
});

GetRouter.get("/vendors", (req, res) => {
  vendorSchema.find({}).then((dbRes) => {
    return res.status(200).json({
      key: "Success",
      data: dbRes,
      message: "Vendor List",
    });
  });
});

GetRouter.get("/purchaseItems", AuthenticationMiddleware, (req, res) => {
  PurchaseItemSchema.find({}).then((dbRes) => {
    return res.status(200).json({
      key: "Success",
      data: dbRes,
      message: "Purchase Items List",
    });
  });
});

GetRouter.get("/vendorCredit", AuthenticationMiddleware, (req, res) => {
  PurchaseItemSchema.find({ isPaidFull: false })
    .populate("vendor_id")
    .then((dbRes) => {
      return res.status(200).json({
        key: "Success",
        data: dbRes,
        message: "Vendor Credit List",
      });
    });
});

GetRouter.get("/bills", AuthenticationMiddleware, async (req, res) => {
  PurchaseItemSchema.find({ isPaidFull: true })
    .populate("vendor_id")
    .then((dbRes) => {
      return res.status(200).json({
        key: "Success",
        data: dbRes,
        message: "Vendor Bills List",
      });
    });
});

module.exports = GetRouter;
