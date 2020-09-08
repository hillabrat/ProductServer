const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  surName: String,
  address: String,
  city: String,
  phoneNumber: String,
});

module.exports = mongoose.model("User", userSchema);
