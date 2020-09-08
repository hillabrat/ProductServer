const mongoose = require("mongoose");

const productsSchema = new mongoose.Schema({
  _id: Number,
  title: String,
  image: String,
  quantity: Number,
  price: Number,
  description: String,
});

module.exports = mongoose.model("products", productsSchema);
