const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const purchaseItemSchema = new Schema(
  {
    vendor_id: {
      type: Schema.Types.ObjectId,
      ref: "vendor",
    },
    invoiceNo: {
      type: String,
    },
    purchaseDate: {
      type: Date,
      default: Date.now(),
    },
    paymentTearm: {
      type: String,
      enum: ["FULL", "HALF", "CUSTOM"],
      default: "FULL",
    },
    // items: [
    //   {
    //     itemName: String,
    //     qty: String,
    //     rate: String,
    //     amount: String,
    //   },
    // ],
    productId: [
      {
        type: Schema.Types.ObjectId,
        ref: "Products",
      },
    ],
    totalAmt: String,
    totDueAmt: String,
    paidAmt: String,
    isPaidFull: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("purchaseItems", purchaseItemSchema);
