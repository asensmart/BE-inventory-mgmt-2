const mongoose = require("mongoose");

const orders = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
  },
  awbNumber: {
    type: String,
  },
  customerName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  courier: {
    type: Object,
  },
  replacementOrderId: {
    type: String,
  },
  replacementStatus: {
    type: String,
  },
  replacementCourier: {
    type: Object,
  },
  replacementAwbNumber: {
    type: String,
  },
  replacedAt: {
    type: Date,
  },
  isReplacement: {
    type: Boolean,
    required: true,
  },
  products: {
    type: Array,
    required: true,
  },
  orderedDate: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    required: true,
  },
  mobileNumber: {
    type: Number,
    required: true,
  },
  gstPercentage: {
    type: Number,
    required: true,
  },
  isPrepaid: {
    type: Boolean,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  pinCode: {
    type: Number,
    required: true,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  advancePaid: {
    type: Number,
    required: true,
  },
  shipmentProfit: {
    type: Number,
    required: true,
  },
  totalWeight: {
    type: Number,
    required: true,
  },
  breadth: {
    type: Number,
    required: true,
  },
  height: {
    type: Number,
    required: true,
  },
  length: {
    type: Number,
    required: true,
  },
});

// const dbData = {
//     orderId: '',
//     customerName,
//     email,
//     products,
//     mobileNumber,
//     gstPercentage: parseInt(gstPercentage),
//     address,
//     pinCode: parseInt(pinCode),
//     advancePaid: parseInt(advancePaid),
//     shipmentProfit: parseInt(shipmentProfit)
// }

module.exports = mongoose.model("Order", orders);
