const mongoose = require("mongoose");

const trackProducts = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "vendor",
    },
    name: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    stock: {
      type: Number,
      required: true,
    },
    vendorName: {
      type: String,
      // required: true,
    },
    purchasedPrice: {
      type: Number,
      required: true,
    },
    //   createdAt: {
    //     type: Date,
    //     required: true,
    //   },
    //   updatedAt: {
    //     type: Date,
    //     required: true,
    //   },
  },
  { timestamps: true }
);

module.exports = mongoose.model("trackProducts", trackProducts);
