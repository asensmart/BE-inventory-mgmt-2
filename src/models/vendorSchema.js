const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema(
  {
    vendorName: {
      type: String,
    },
    shopName: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("vendor", vendorSchema);
