const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  products: [{ type: Number, ref: "products" }],
  quantity: Number,
  comments: String,
  isFinished: Boolean,
  date: Date,
});

module.exports = mongoose.model("Order", orderSchema);
