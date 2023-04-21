const express = require("express");
const UpdateRouter = express.Router();
const ProductSchema = require("../models/ProductSchema");
const UserSchema = require("../models/UserSchema");
const ExpenseSchema = require("../models/ExpenseSchema");
const OrderSchema = require("../models/OrderSchema");
var PurchaseItemSchema = require("../models/PurchaseItemSchema");
const bcrypt = require("bcrypt");
const validator = require("node-validator");
const { Globals } = require("../helper/Globals");
const axios = require("axios");
const trackProducts = require("../models/trackProducts");

UpdateRouter.put("/product", async (req, res) => {
  const data = req.body.data;

  await ProductSchema.findOne({ _id: data._id }).then(async (findProduct) => {
    let calculateStock;
    findProduct.stock > data.stock
      ? (calculateStock = findProduct.stock - data.stock)
      : (calculateStock = data.stock - findProduct.stock);

    await trackProducts
      .findOne({ name: data.name })
      .then(async (dbtrackProduct) => {

        const updateDbtrackProduct =
          findProduct.stock > data.stock
            ? dbtrackProduct.stock - calculateStock
            : dbtrackProduct.stock + calculateStock;

        await trackProducts
          .updateOne(
            { _id: dbtrackProduct.id },
            { $set: { stock: updateDbtrackProduct } }
          )
          .then(() => {});
      });
  });
  ProductSchema.findOneAndUpdate(
    { _id: data._id },
    { $set: { ...data, updatedAt: new Date(), label: data.name } }
  )
    .then((dbRes) => {
      res.json({ key: "success", data: dbRes });
    })
    .catch((err) => {
      console.log(err);
      res.json({ key: "error", data: err });
    });
});

UpdateRouter.put("/expense", (req, res) => {
  const data = req.body.data;
  ExpenseSchema.findOneAndUpdate({ _id: data._id }, { $set: { ...data } })
    .then((dbRes) => {
      res.json({ key: "success", data: dbRes });
    })
    .catch((err) => {
      console.log(err);
      res.json({ key: "error", data: err });
    });
});

UpdateRouter.put("/user", (req, res) => {
  const data = req.body.data;
  if (data.isPasswordChanged) {
    bcrypt.hash(data.password, 14).then((encryptedPassword) => {
      UserSchema.findOneAndUpdate(
        { _id: data._id },
        { $set: { ...data, password: encryptedPassword } },
        { new: true }
      )
        .then((dbRes) => {
          res.json({ key: "success", data: dbRes });
        })
        .catch((err) => {
          console.log(err);
          res.json({ key: "error", data: err });
        });
    });
  } else {
    delete data.password;
    UserSchema.findOneAndUpdate(
      { _id: data._id },
      { $set: { ...data } },
      { new: true }
    )
      .then((dbRes) => {
        res.json({ key: "success", data: dbRes });
      })
      .catch((err) => {
        console.log(err);
        res.json({ key: "error", data: err });
      });
  }
});

UpdateRouter.put("/order", (req, res) => {
  const data = req.body.data;
  OrderSchema.findOneAndUpdate(
    { _id: data._id },
    { $set: { ...data, orderedDate: new Date(data.orderedDate) } },
    { new: true }
  )
    .then((dbRes) => {
      if (data.isAwbNumberAdded) {
        const { awbNumber, orderId, customerName, email, mobileNumber } = dbRes;
        const courier = data.courier;
        const bodyData = {
          username: Globals.shipWayCredential.username,
          password: Globals.shipWayCredential.password,
          carrier_id: courier.id,
          awb: awbNumber,
          order_id: orderId,
          first_name: customerName,
          last_name: customerName,
          email: email,
          phone: mobileNumber,
          products: "N/A",
          company: "BISMI shop",
          shipment_type: "1",
        };
        axios
          .post(`${Globals.shipWayApiUrl}/PushOrderData`, bodyData)
          .then((shipWayRes) => {
            if (shipWayRes.data.status === "Success") {
              res.json({ key: "success" });
            } else {
              res.json({ key: "error", message: shipWayRes.data.message });
            }
          });
      } else {
        res.json({ key: "success" });
      }
    })
    .catch((err) => {
      console.log(err);
      res.json({ key: "error", data: err });
    });
});

UpdateRouter.put("/moveToReplacement", (req, res) => {
  OrderSchema.findOneAndUpdate(
    { _id: req.body.id },
    {
      $set: {
        isReplacement: true,
        replacementStatus: "pending",
        replacedAt: new Date(),
      },
    }
  )
    .then(() => {
      res.json({ key: "success" });
    })
    .catch((err) => {
      console.log(err);
      res.json({ key: "error", data: err });
    });
});

UpdateRouter.put("/replacement", (req, res) => {
  const data = req.body.data;
  OrderSchema.findOneAndUpdate(
    { _id: data.id },
    { $set: { ...data } },
    { new: true }
  ).then((dbRes) => {
    const {
      replacementCourier,
      replacementAwbNumber,
      replacementOrderId,
      customerName,
      email,
      mobileNumber,
    } = dbRes;
    const bodyData = {
      username: Globals.shipWayCredential.username,
      password: Globals.shipWayCredential.password,
      carrier_id: replacementCourier.id,
      awb: replacementAwbNumber,
      order_id: replacementOrderId,
      first_name: customerName,
      last_name: customerName,
      email: email,
      phone: mobileNumber,
      products: "N/A",
      company: "BISMI shop",
      shipment_type: "1",
    };
    axios
      .post(`${Globals.shipWayApiUrl}/PushOrderData`, bodyData)
      .then((shipWayRes) => {
        if (shipWayRes.data.status === "Success") {
          res.json({ key: "success" });
        } else {
          res.json({ key: "error", message: shipWayRes.data.message });
        }
      });
  });
});

UpdateRouter.put("/vendorCredit/:id", (req, res) => {
  const req_data = req.body;

  const purchaseId = req.params.id;

  const check = validator
    .isObject()
    .withRequired("paidAmt", validator.isString());

  validator.run(check, req_data, async (errCount, errs) => {
    if (errCount > 0) {
      return res.status(400).json({
        key: "error",
        data: errs,
        message: "Invalid parameter",
      });
    }

    if (parseFloat(req_data.paidAmt) < 0) {
      return res.status(400).json({
        key: "Failure",
        message: "Please enter a valid amount",
      });
    }

    await PurchaseItemSchema.findOne({ _id: purchaseId }).then(
      async (findPurchase) => {
        if (!findPurchase) {
          return res.status(400).json({
            key: "Failure",
            message: "User not found!",
          });
        }

        if (
          parseFloat(req_data.paidAmt) + parseFloat(findPurchase.paidAmt) >
          parseFloat(findPurchase.totalAmt)
        ) {
          return res.status(400).json({
            key: "Failure",
            message: "Paid amount is higher than total amount",
          });
        }

        const payAmt = req_data.paidAmt;

        req_data.paidAmt = (
          parseFloat(req_data.paidAmt) + parseFloat(findPurchase.paidAmt)
        ).toString();

        if (findPurchase.totalAmt === req_data.paidAmt) {
          console.log("Entered if");
          const totalDueCalc = (
            parseFloat(findPurchase.totDueAmt) - parseFloat(payAmt)
          ).toString();

          await PurchaseItemSchema.updateMany(
            { vendor_id: findPurchase.vendor_id },
            { $set: { totDueAmt: totalDueCalc } }
          );

          await PurchaseItemSchema.updateOne(
            { _id: findPurchase._id },
            {
              $set: {
                paymentTearm: "FULL",
                paidAmt: req_data.paidAmt,
                totDueAmt: totalDueCalc,
                isPaidFull: true,
              },
            }
          ).then(async (updatePurchase) => {
            return res.json({
              key: "Success",
              update: updatePurchase,
              message: "Amount Updated successfully!",
            });
          });
        } else {
          console.log("Entered else");
          const totalDueCalc = (
            parseFloat(findPurchase.totDueAmt) - parseFloat(payAmt)
          ).toString();
          await PurchaseItemSchema.updateMany(
            { vendor_id: findPurchase.vendor_id },
            { $set: { totDueAmt: totalDueCalc } }
          );

          await PurchaseItemSchema.updateOne(
            { _id: findPurchase._id },
            {
              $set: {
                paidAmt: req_data.paidAmt,
                totDueAmt: totalDueCalc,
              },
            }
          ).then((updatePurchase) => {
            return res.json({
              key: "Success",
              update: updatePurchase,
              message: "Amount Updated successfully!",
            });
          });
        }
      }
    );
  });
});

module.exports = UpdateRouter;
