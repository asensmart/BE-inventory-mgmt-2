const localDbUrl = "mongodb://localhost:27017/invendory-mgmt";
const cloudDbUrl = process.env.MONGO_URL;

const shipWayApiUrl = "https://shipway.in/api/";

const shipWayCredential = {
  username: process.env.SHIPWAY_USER,
  password: process.env.SHIPWAY_PASS,
};

const pickrrFromDetails = {
  from_name: "Bismi shop",
  from_phone_number: "9898009865",
  from_address: "No: 308, Ground floor, Vyasarpadi",
  from_pincode: "600039",
};

const Globals = {
  port: 8000,
  emailId: "test123@gmail.com",
  mailPassword: "cabqlgaeftfcqewk",
  dbUrl: cloudDbUrl, //localDbUrl,
  shipWayApiUrl,
  shipWayCredential,
  pickrrFromDetails,
  pickrrAuthKey: process.env.PICKRR_AUTH_KEY, //test API KEY
};

module.exports = { Globals };
