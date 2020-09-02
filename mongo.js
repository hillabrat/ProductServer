const mongoose = require("mongoose");

function connectToDB() {
  return mongoose.connect("mongodb://localhost/shopDB", {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
  });
}

connectToDB().then(async () => {
  console.log("connected");

  const kittySchema = new mongoose.Schema({
    _id: String,
    title: String,
    image: String,
    quantity: Number,
    price: Number,
    description: String,
  });

  const p = mongoose.model("products", kittySchema);

  const newP = new p({
    _id: "1",
    title: "Ad_idas T-Shirt",
    image: "images/image1598495649916.jpg",
    quantity: "200",
    price: "10",
    description:
      "Adidas T-Shirt afd sdf sdf sdf sd ml j j,m njk hjk h kעכיכאיjh nj nkl jlk jkl j",
  });
  newP.save();

  //   const data = await Kitten.find().exec();
  //   console.log(data);
});
