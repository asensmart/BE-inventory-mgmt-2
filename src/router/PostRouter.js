const express = require("express");
const ProductSchema = require("../models/ProductSchema");
const UserSchema = require("../models/UserSchema");
const ExpenseSchema = require("../models/ExpenseSchema");
const OrderSchema = require("../models/OrderSchema");
var vendorSchema = require("../models/vendorSchema");
var PurchaseItemSchema = require("../models/PurchaseItemSchema");
const bcrypt = require("bcrypt");
const JWT = require("jsonwebtoken");
const validator = require("node-validator");
const { AuthenticationMiddleware } = require("../helper/Middlewares");
const { default: axios } = require("axios");
const { Globals } = require("../helper/Globals");
const trackProducts = require("../models/trackProducts");
const PostRouter = express.Router();
const SECRET_KEY = `35912624597df678ec821c4a1b92734738kjdd6d01c93779964eda5a95f1604656e2a673bfbb0aa`;

const GEN_INVOICE = () => {
  let year = new Date().getFullYear();
  let month = new Date().getMonth();
  let date = new Date().getDate();
  let randomNumber = Math.floor(Math.random() * 90000) + 10000;
  let UUID = `${year}${month}${date}-${randomNumber}`;
  return UUID;
};

PostRouter.post("/verifyToken", AuthenticationMiddleware, (req, res) => {
  res.json({ key: "success", data: req.user });
  res.end();
});

PostRouter.post("/product", AuthenticationMiddleware, (req, res) => {
  const data = req.body.data;

  ProductSchema({
    ...data,
    label: data.name,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
    .save()
    .then(() => {
      res.json({ key: "success" });
    })
    .catch((err) => {
      res.json({ key: "error", data: err, message: "Something went wrong" });
    });
});

PostRouter.post("/expense", AuthenticationMiddleware, (req, res) => {
  const data = req.body.data;

  ExpenseSchema({
    ...data,
    createdAt: new Date(),
  })
    .save()
    .then(() => {
      res.json({ key: "success" });
    })
    .catch((err) => {
      res.json({ key: "error", data: err, message: "Something went wrong" });
    });
});

PostRouter.post("/user", AuthenticationMiddleware, (req, res) => {
  const data = req.body.data;

  UserSchema.findOne({ username: data.username }).then((dbRes) => {
    if (dbRes === null) {
      bcrypt.hash(data.password, 14).then((encryptedPassword) => {
        UserSchema({
          ...data,
          isAdmin: false,
          password: encryptedPassword,
          createdAt: new Date(),
        })
          .save()
          .then(() => {
            res.json({ key: "success" });
          })
          .catch((err) => {
            res.json({
              key: "error",
              data: err,
              message: "Something went wrong",
            });
          });
      });
    } else {
      res.json({ key: "error", message: "Username already taken" });
    }
  });
});

PostRouter.post("/order", AuthenticationMiddleware, (req, res) => {
  const data = req.body.data;
  OrderSchema.findOne({ orderId: data.orderId }).then((dbRes) => {
    if (dbRes === null) {
      OrderSchema({
        ...data,
        orderedDate: new Date(data.orderedDate),
        createdAt: new Date(),
        isReplacement: false,
      })
        .save()
        .then((result) => {
          const updatedProducts = [];
          const products = data.products;

          const pickrrProducts = [];
          var itemName = [];

          products.map((item) => {
            const product = {
              price: item.salesPrice, //Price of single unit inclusive of GST
              item_name: item.name,
              quantity: item.quantity, //Total units of this item
            };

            pickrrProducts.push(product);

            itemName.push(item.name + " X " + item.quantity.toString());
          });

          const payload = {
            auth_token: Globals.pickrrAuthKey,
            item_name: itemName.toString(),
            item_list: pickrrProducts,
            from_name: Globals.pickrrFromDetails.from_name,
            from_phone_number: Globals.pickrrFromDetails.from_phone_number,
            from_address: Globals.pickrrFromDetails.from_address,
            from_pincode: Globals.pickrrFromDetails.from_pincode,
            to_name: result.customerName.toString(),
            to_email: result.email,
            to_phone_number: result.mobileNumber.toString(),
            to_pincode: result.pinCode.toString(),
            to_address: result.address.toString(),
            quantity: products.length, //Total quantity of the shipment
            invoice_value: result.totalPrice, //Total invoice value inclusive of GST
            cod_amount:
              result.isPrepaid === false
                ? result.totalPrice - result.advancePaid
                : 0, //Total COD to be collected inclusive of GST
            client_order_id: result.orderId,
            item_breadth: result.breadth, //cms
            item_length: result.length,
            item_height: result.height,
            item_weight: result.totalWeight, //kg
            item_tax_percentage: result.gstPercentage,
            shipping_charge: result.shipmentProfit,
          };

          axios
            .post("https://pickrr.com/api/place-order/", payload)
            .then((response) => {
              console.log(response.status); // 200
            })
            .catch((error) => {
              console.error("error");
            });

          // *******************************************************************************************

          products.forEach((p) => {
            updatedProducts.push({
              updateOne: {
                filter: { _id: p._id },
                update: { $inc: { stock: -parseInt(p.quantity) } },
              },
            });
          });
          // ProductSchema.bulkWrite(updatedProducts)
          trackProducts.bulkWrite(updatedProducts)
            .then(() => {
              res.json({ key: "success" });
            })
            .catch((err) => {
              res.json({
                key: "error",
                data: err,
                message: "Something went wrong",
              });
            });
        })
        .catch((err) => {
          res.json({
            key: "error",
            data: err,
            message: "Something went wrong",
          });
        });
    } else {
      res.json({ key: "error", message: "Order Id already exists" });
    }
  });
});

PostRouter.post("/login", (req, res) => {
  const data = req.body.data;

  const { username, password } = data;

  UserSchema.findOne({ username }).then((dbRes) => {
    if (dbRes !== null) {
      bcrypt.compare(password, dbRes.password).then((pass) => {
        if (pass) {
          let payload = {
            username,
          };
          res.json({
            key: "success",
            data: dbRes,
            token: JWT.sign(payload, SECRET_KEY, { expiresIn: 2629800 }),
          });
        } else {
          res.json({ key: "error", message: "Password not matched" });
        }
      });
    } else {
      if (username === "admin") {
        UserSchema.findOne({ isAdmin: true }).then((adminRes) => {
          if (adminRes === null) {
            bcrypt.hash(password, 14).then((encryptedPass) => {
              UserSchema({
                username,
                password: encryptedPass,
                createdAt: new Date(),
                name: "Admin",
                role: "Admin",
                isAdmin: true,
              })
                .save()
                .then(() => {
                  let payload = {
                    username,
                  };
                  res.json({
                    key: "success",
                    data: dbRes,
                    token: JWT.sign(payload, SECRET_KEY, {
                      expiresIn: 2629800,
                    }),
                  });
                });
            });
          } else {
            res.json({ key: "error", message: "User not found" });
          }
        });
      } else {
        res.json({ key: "error", message: "User not found" });
      }
    }
  });
});

PostRouter.post("/vendor", (req, res) => {
  const req_data = req.body;

  const check = validator
    .isObject()
    .withRequired("vendorName", validator.isString())
    .withRequired("shopName", validator.isString());

  validator.run(check, req_data, async (errCount, errs) => {
    if (errCount > 0) {
      return res.status(400).json({
        key: "error",
        data: errs,
        message: "Invalid parameter",
      });
    }
    const isUserExist = await vendorSchema.findOne({
      vendorName: req_data.vendorName,
    });

    if (isUserExist) {
      return res.json({
        key: "Failure",
        data: isUserExist.vendorName,
        message: "Vendor name already exist",
      });
    } else {
      await vendorSchema.create(req_data, (err, userRec) => {
        if (err) {
          return res.status(400).json({
            key: "Failure",
            message: err,
          });
        }
        return res.status(201).json({
          key: "Success",
          data: userRec,
          message: "Vendor added successfully",
        });
      });
    }
  });
});

PostRouter.post("/addPurchaseItem", (req, res) => {
  let req_data = req.body;
  req_data = req_data.data;

  const check = validator
    .isObject()
    .withRequired("vendor_id", validator.isString())
    .withOptional("invoiceNo", validator.isString())
    .withOptional("purchaseDate", validator.isDate())
    .withRequired("paymentTearm", validator.isString())
    .withOptional("items", validator.isArray())
    .withRequired("totalAmt", validator.isString())
    .withOptional("paidAmt", validator.isString())
    .withOptional("totDueAmt", validator.isString())
    .withOptional("isPaidFull", validator.isBoolean());

  validator.run(check, req_data, async (errCount, errs) => {
    if (errCount > 0) {
      return res.status(400).json({
        key: "error",
        data: errs,
        message: "Invalid parameter",
      });
    }

    console.log("items ---> \n", req_data.items);

    if (req_data.vendor_id === "") {
      return res.status(400).json({
        key: "Failure",
        message: "Please select a Vendor",
      });
    }

    if (req_data.totalAmt === "null") {
      return res.status(400).json({
        key: "Failure",
        message: "Please enter the correct Amout. The total amount not be NaN",
      });
    }

    if (req_data.paidAmt < 0) {
      return res.status(400).json({
        key: "Failure",
        message: "Please enter a valid amount",
      });
    }

    req_data.invoiceNo = GEN_INVOICE();

    if (req_data.paymentTearm === "FULL") {
      req_data.paidAmt = req_data.totalAmt;
      req_data.isPaidFull = true;
    }

    if (req_data.paymentTearm === "HALF") {
      const halfCalc = parseFloat(req_data.totalAmt) / 2;
      req_data.paidAmt = halfCalc.toString();
    }

    if (req_data.paymentTearm === "CUSTOM") {
      if (req_data.paidAmt === "") {
        return res.status(400).json({
          key: "Failure",
          message: "Please enter the Amount in the Custom input",
        });
      }

      if (req_data.paidAmt === req_data.totalAmt) {
        req_data.paidAmt = req_data.totalAmt;
        req_data.isPaidFull = true;
      }

      if (parseFloat(req_data.paidAmt) > parseFloat(req_data.totalAmt)) {
        return res.status(400).json({
          key: "Failure",
          message: "Paid amount is higher than total amount",
        });
      }
    }

    var temp = [];

    const promises = req_data.items.map(async (item, i) => {
      const products = await trackProducts.findOne({
        vendorId: req_data.vendor_id,
        name: item.itemName.toLowerCase(),
      });

      if (products === null) {
        const createProduct = {
          vendorId: req_data.vendor_id,
          name: item.itemName.toLowerCase(),
          label: item.itemName,
          stock: item.qty,
          purchasedPrice: item.rate,
        };

        await trackProducts.create(createProduct).then(() => {});
      } else {
        const addTotalStock = products.stock + item.qty;
        await trackProducts
          .updateOne({ _id: products.id }, { $set: { stock: addTotalStock } })
          .then(() => {});
      }

      const doc = await ProductSchema.create({
        vendorId: req_data.vendor_id,
        name: item.itemName.toLowerCase(),
        label: item.itemName,
        stock: item.qty,
        purchasedPrice: item.rate,
      });

      return doc._id;
    });

    Promise.all(promises).then(async (result) => {
      temp.push(...result);

      req_data.productId = temp;
      await PurchaseItemSchema.find({ vendor_id: req_data.vendor_id }).then(
        async (itemRes) => {
          var totalDue = 0;

          if (itemRes.length === 0) {
            totalDue =
              parseFloat(req_data.totalAmt) - parseFloat(req_data.paidAmt);
            req_data.totDueAmt = totalDue.toString();
          }

          if (itemRes.length > 0) {
            {
              const dueAmt =
                parseFloat(req_data.totalAmt) - parseFloat(req_data.paidAmt);

              totalDue = parseFloat(itemRes[0].totDueAmt) + dueAmt;
              req_data.totDueAmt = totalDue.toString();

              await PurchaseItemSchema.updateMany(
                { vendor_id: itemRes[0].vendor_id },
                { $set: { totDueAmt: req_data.totDueAmt } }
              );
            }
          }

          await PurchaseItemSchema.create(req_data, (err, dbRes) => {
            if (err) {
              return res.status(400).json({
                key: "Failure",
                message: err,
              });
            }

            return res.status(201).json({
              key: "Success",
              data: dbRes,
              TotalDueAmt: totalDue,
              message: "Items added successfully",
            });
          });

          // const findVendors = await trackProducts.find({
          //   vendor_id: req_data.vendor_id,
          //   productName: "bike",
          // });

          // req_data.items.map(async (products, i) => {
          //   const findProduct = await trackProducts.find({
          //     vendor_id: req_data.vendor_id,
          //     name: products.itemName.toLowerCase(),
          //   });

          //   console.log("findProduct --->", i, "--->", findProduct);

          //   if (findProduct.length === 0) {
          //     const Productdata = {
          //       name: products.itemName.toLowerCase(),
          //       lable: products.itemName,
          //       vendor_id: req_data.vendor_id,
          //       stock: products.qty,
          //     };
          //     trackProducts
          //       .create(Productdata)
          //       .then((dbRes) => {
          //         console.log("dbRes --->", dbRes);
          //       })
          //       .catch((err) => {
          //         console.log("Error", err);
          //       });
          //   } else {
          //     const addTotalStockCount = findProduct[0].stock + products.qty;

          //     console.log("addTotalStockCount -->", addTotalStockCount);

          //     await trackProducts
          //       .updateOne(
          //         { id: findProduct._id },
          //         { $set: { stock: addTotalStockCount } }
          //       )
          //       .then((updataRes) => {
          //         console.log("updataRes -->", updataRes);
          //       });
          //   }
          // });
        }
      );
    });
  });
});

PostRouter.post("/purchaseReport", async (req, res) => {
  const req_data = req.body;

  const pageNumber = req_data.page; // Assuming the page number is passed in the request body

  const limit = 10; // Number of documents to return per page

  const skip = (pageNumber - 1) * limit;

  OrderSchema.aggregate([
    {
      $match: {
        orderedDate: {
          $gte: new Date(req_data.fromDate),
          $lte: new Date(req_data.toDate),
        },
      },
    },
    {
      $unwind:
        /**
         * path: Path to the array field.
         * includeArrayIndex: Optional name for index.
         * preserveNullAndEmptyArrays: Optional
         *   toggle to unwind null and empty values.
         */
        {
          path: "$products",
          includeArrayIndex: "arrayIndex",
          preserveNullAndEmptyArrays: true,
        },
    },
    {
      $group:
        /**
         * _id: The id of the group.
         * fieldN: The first field name.
         */
        {
          _id: {
            vendorId: "$products.vendorId",
            isPrepaid: "$isPrepaid",
          },
          totalEarnings: {
            $sum: {
              $multiply: [
                {
                  $toInt: "$products.quantity",
                },
                "$products.purchasedPrice",
              ],
            },
          },
        },
    },
    {
      $group: {
        _id: {
          vendorId: "$_id.vendorId",
        },
        prepaidTotalEarnings: {
          $sum: {
            $cond: [
              {
                $eq: ["$_id.isPrepaid", true],
              },
              "$totalEarnings",
              0,
            ],
          },
        },
        CODTotalEarnings: {
          $sum: {
            $cond: [
              {
                $eq: ["$_id.isPrepaid", false],
              },
              "$totalEarnings",
              0,
            ],
          },
        },
      },
    },
    // {
    //   $count: "total", // Count the number of documents and rename the result as "total"
    // },
    // {
    //   $skip: skip, // Skip the calculated number of documents
    // },
    // {
    //   $limit: limit, // Limit the number of documents returned to the specified limit
    // },
  ]).exec(async (err, result) => {
    if (err) {
      res.send({ err: err });
    }

    const paginationCount = Math.ceil(result.length / limit);

    const slicedData = result.slice(skip, pageNumber * limit);

    return res.json({
      fillData: slicedData,
      fillDataCount: paginationCount,
    });
  });
});

module.exports = PostRouter;
