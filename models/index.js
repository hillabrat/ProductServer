const mongoose = require("mongoose");

const User = require("./User.js");
const Order = require("./Order.js");
const Product = require("./Product.js");

const connectDb = () => {
  return mongoose.connect("mongodb://localhost/shopDB");
};

const models = { User, Order, Product };

module.exports = { connectDb, models };
