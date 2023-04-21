const express = require("express");
const DeleteRouter = express.Router();
const ProductSchema = require("../models/ProductSchema");
const UserSchema = require("../models/UserSchema");
const ExpenseSchema = require("../models/ExpenseSchema");
const OrderSchema = require("../models/OrderSchema");
var PurchaseItemSchema = require("../models/PurchaseItemSchema");
const trackProducts = require("../models/trackProducts");

DeleteRouter.delete("/product", async (req, res) => {
  await ProductSchema.findOne({ _id: req.body.id }).then((product) => {
    console.log("product --->", product);
    trackProducts
      .findOne({ vendorId: product.vendorId, name: product.name })
      .then((dbTrackProduct) => {
        trackProducts
          .updateOne(
            { _id: dbTrackProduct.id },
            { $set: { stock: dbTrackProduct.stock - product.stock } }
          )
          .then(() => {});
      });
  });

  ProductSchema.findOneAndDelete({ _id: req.body.id }).then(() => {
    res.json({ key: "success" });
  });
});

DeleteRouter.delete("/expense", (req, res) => {
  ExpenseSchema.findOneAndDelete({ _id: req.body.id }).then(() => {
    res.json({ key: "success" });
  });
});

DeleteRouter.delete("/user", (req, res) => {
  UserSchema.findOneAndDelete({ _id: req.body.id }).then(() => {
    res.json({ key: "success" });
  });
});

DeleteRouter.delete("/order", (req, res) => {
  OrderSchema.findOneAndDelete({ _id: req.body.id }).then(() => {
    res.json({ key: "success" });
  });
});

DeleteRouter.delete("/removePurchaseItem/:id", (req, res) => {
  const id = req.params.id;

  PurchaseItemSchema.findOne({ _id: id }).then(async (findUser) => {
    // Find the currentPurchase Due amout
    const findDueAmt =
      parseFloat(findUser.totalAmt) - parseFloat(findUser.paidAmt);

    // Update total due against the vendor
    const updateTotalDue = parseFloat(findUser.totDueAmt) - findDueAmt;

    await PurchaseItemSchema.updateMany(
      { vendor_id: findUser.vendor_id },
      { $set: { totDueAmt: updateTotalDue.toString() } }
    );

    findUser.productId.map(async (products, i) => {
      await ProductSchema.findOneAndDelete({ _id: products });
    });

    PurchaseItemSchema.deleteOne({ _id: id }).then(() => {
      return res.json({
        key: "Success",
      });
    });
  });
});

module.exports = DeleteRouter;
