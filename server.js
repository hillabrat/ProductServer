const express = require("express");
const fs = require("fs");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const helpers = require("./helpers");
const imageDir = "images";
const noImage = "images/NoImage.png";
const http = require("http");
const socketIo = require("socket.io");
const server = http.createServer(app);
const io = socketIo(server);
const mongoose = require("mongoose");
const { models, connectDb } = require("./models");
const { timeStamp } = require("console");

mongoose.set("debug", true);

// const productsSchema = new mongoose.Schema({
//   _id: Number,
//   title: String,
//   image: String,
//   quantity: Number,
//   price: Number,
//   description: String,
// });

app.use(bodyParser.json());

app.use(express.json());

app.use(cors());

app.use(`/${imageDir}`, express.static(imageDir));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, `${imageDir}/`);
  },

  // By default, multer removes file extensions so let's add them back
  filename: function (req, file, cb) {
    cb(null, file.fieldname + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  dest: `${imageDir}/`,
  storage: storage,
  fileFilter: helpers.imageFilter,
}).single("image");

function connectToDB() {
  return mongoose.connect("mongodb://localhost/shopDB", {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
  });
}

app.post("/Login", (req, res) => {
  console.log(req.body);
  const { Email, Password } = req.body;
  console.log(Email, Password);
  console.log("process.env.Admin_Email", process.env.Admin_Email);
  console.log("process.env.Admin_Password", process.env.Admin_Password);
  if (
    Email === process.env.Admin_Email &&
    Password === process.env.Admin_Password
  ) {
    res.status(200).send("OK");
  } else {
    res.status(200).send("Unauthorized");
  }
});

app.get("/products", (req, res) => {
  //const prods = mongoose.model("products", productsSchema);
  const search = req.query.search;
  let productList;
  console.log("search", search);
  models.Product.find({ title: { $regex: search, $options: "i" } }, function (
    err,
    productList
  ) {
    if (err) return console.error(err);
    console.log("productList", productList);
    res.send(productList);
  });
});

//get product by id
app.get("/products/:id", (req, res) => {
  const productId = +req.params.id;
  //const prods = mongoose.model("products", productsSchema);
  let productInfo;

  models.Product.findById(productId, function (err, productInfo) {
    if (err) return console.error(err);
    res.send(productInfo);
  });
});

// add new product + upload image
app.post("/products", (req, res) => {
  var dir = imageDir;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  upload(req, res, (err) => {
    if (err) {
      res.status(400).send("Something went wrong!");
    }

    let imgFileName;

    if (req.file) {
      imgFileName = `${imageDir}/${req.file.filename}`;
    } else {
      imgFileName = noImage;
    }

    //const prods = mongoose.model("products", productsSchema);
    let prodMaxId;

    models.Product.find()
      .sort({ _id: -1 })
      .select({ _id: true })
      .limit(1)
      .then(function (result) {
        prodMaxId = result.length === 0 ? 1 : +result[0]._id + 1;

        const newProd = new prods({
          _id: prodMaxId,
          title: req.body.title,
          image: imgFileName,
          quantity: +req.body.quantity,
          price: +req.body.price,
          description: req.body.description,
        });
        newProd.save();
        res.send("Add product method completed");
      });
  });
});

//delete product by id + delete server image
app.delete("/products/:id", (req, res) => {
  const productId = +req.params.id;

  console.log("delete by id", productId);
  //const prods = mongoose.model("products", productsSchema);
  let productInfo;

  models.Product.findById(productId, function (err, productInfo) {
    if (err) return console.error(err);
    console.log("product", productInfo);

    const imgFileName = productInfo.image;
    console.log("imgFileName", imgFileName);

    //delete image file
    console.log(`deleting local image (${imgFileName})`);
    if (!imgFileName.endsWith(noImage)) {
      fs.unlink(imgFileName, (err) => {
        if (err) {
          console.log(`failed to delete local image:${err}`);
        }
      });
    }

    //delete product
    productInfo.remove();

    res.send(`product id ${productId} has been deleted`);
  });
});

//update product quantity
app.put("/products/updateQuantity/:id", (req, res) => {
  const productId = +req.params.id;
  //const prods = mongoose.model("products", productsSchema);
  let productInfo;

  models.Product.findByIdAndUpdate(
    productId,
    { quantity: +req.body.quantity },
    function (err, productInfo) {
      console.log("productInfo", productInfo);
      if (productInfo) {
        if (err) return console.error(err);
        io.emit(
          "getProductQuantityToUpdate",
          productInfo.id,
          +req.body.quantity
        );
        res.send("Update product quantity method completed");
      } else
        res.send(
          `Update product quantity method FAILED - product id ${productId} not found!`
        );
    }
  );
});

//update product info
app.put("/products/:id", (req, res) => {
  const productId = +req.params.id;
  //const prods = mongoose.model("products", productsSchema);
  let productInfo;

  upload(req, res, (err) => {
    if (err) {
      res.status(400).send("Something went wrong!");
    }

    let updateQuery = { _id: productId };
    let updateValues = { $set: {} };

    if (req.file) {
      // if (!productInfo.image.endsWith(noImage)) {
      //   fs.unlink(productInfo.image, (err) => {
      //     if (err) {
      //       console.log(`failed to delete local image:${err}`);
      //     }
      //     //else {
      //     //   console.log(`successfully deleted local image`);
      //     // }
      //   });
      // }
      updateValues.$set["image"] = `${imageDir}/${req.file.filename}`;
    }

    if (req.body.title) updateValues.$set["title"] = req.body.title;
    if (req.body.price) updateValues.$set["price"] = +req.body.price;
    if (req.body.quantity) updateValues.$set["quantity"] = +req.body.quantity;
    if (req.body.description)
      updateValues.$set["description"] = req.body.description;

    console.log("updateValues", updateValues);

    models.Product.update(updateQuery, updateValues, function (
      err,
      productInfo
    ) {
      console.log("productInfo", productInfo);
      if (productInfo) {
        if (err) return console.error(err);

        res.send("Update product method completed");
      } else
        res.send(
          `Update product method FAILED - product id ${productId} not found!`
        );
    });
  });
});

//get product by id
app.get("/products/cartTest/:id", async (req, res) => {
  //const prods = mongoose.model("products", productsSchema);
  console.log("cartTest----------------");

  const productId = +req.params.id;

  let productInfo = await models.Product.find().exec();

  console.log("productInfo", productInfo);

  const orderInCart = new models.Order({
    products: [productInfo[0]._id, productInfo[1]._id, productInfo[2]._id],
    quantity: 5,
    comments: "big",
    isFinished: 0,
    date: new Date(),
  });

  orderInCart.save();

  let order1 = await models.Order.findOne().populate("products").exec();
  console.log(order1);
  res.send(order1);
});

connectToDB().then(async () => {
  server.listen(8000, () => {
    console.log(`Example app listening on port 8000!`);
  });
});
