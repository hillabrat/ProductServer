const express = require("express");
const fs = require("fs");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const helpers = require("./helpers");
const imageDir = "images";

app.use(bodyParser.json());

app.use(express.json());

app.use(cors());

app.use("/images", express.static("images"));

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

// search string in product's title
app.get("/products", (req, res) => {
  const search = req.query.search;
  fs.readFile("products.json", (err, data) => {
    const products = JSON.parse(data);
    if (search) {
      const filteredProducts = products.filter((product) =>
        product.title.toLowerCase().includes(search.toLowerCase())
      );
      res.send(filteredProducts);
    } else {
      res.send(products);
    }
  });
});

//get product by id
app.get("/products/:id", (req, res) => {
  fs.readFile("products.json", (err, data) => {
    const products = JSON.parse(data);
    const productId = +req.params.id;
    const productInfo = products.find((product) => product.id === productId);
    res.send(productInfo);
  });
});

// // add new product
// app.post("/productsO", (req, res) => {
//   fs.readFile("products.json", (err, data) => {
//     const products = JSON.parse(data);
//     const title = req.body.title;
//     const image = req.body.image;
//     const quantity = req.body.quantity;
//     const price = req.body.price;
//     const description = req.body.description;
//     products.push({
//       id: products.length + 1,
//       title: title,
//       image: image,
//       quantity: quantity,
//       price: price,
//       description: description,
//     });
//     fs.writeFile("products.json", JSON.stringify(products), (err) => {
//       // console.log(err);
//       res.send("YOU SUCCEED!!!");
//     });
//   });
// });

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

    const imgFileName = `${imageDir}/${req.file.filename}`;

    fs.readFile("products.json", (err, data) => {
      const products = JSON.parse(data);
      const title = req.body.title;
      const image = imgFileName;
      const quantity = req.body.quantity;
      const price = req.body.price;
      const description = req.body.description;
      products.push({
        id: Math.max(...products.map((p) => p.id)) + 1,
        title: title,
        image: image,
        quantity: quantity,
        price: price,
        description: description,
      });

      fs.writeFile("products.json", JSON.stringify(products), (err) => {
        res.send("YOU SUCCEED!!!");
      });
    });
  });
});

//delete product by id + deete server image
app.delete("/products/:id", (req, res) => {
  console.log("delete method");
  fs.readFile("products.json", (err, data) => {
    const products = JSON.parse(data);
    const productId = +req.params.id;
    const productIndex = products.findIndex(
      (product) => product.id === productId
    );

    const imgFileName = products[productIndex].image;

    //delete image file
    console.log(`deleting local image (${imgFileName})`);
    fs.unlink(imgFileName, (err) => {
      if (err) {
        console.log(`failed to delete local image:${err}`);
      } else {
        console.log(`successfully deleted local image`);
      }
    });

    products.splice(productIndex, 1);
    fs.writeFile("products.json", JSON.stringify(products), (err) => {
      res.send("YOU SUCCEED!!!");
    });
  });
});

//update product attributes
app.put("/products/:id", (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      res.status(400).send("Something went wrong!");
    }
    fs.readFile("products.json", (err, data) => {
      const products = JSON.parse(data);
      const productId = +req.params.id;
      // console.log("req.body", req.body);

      // console.log("req.body.image", req.body.image);
      console.log("productId", productId);
      const productIndex = products.findIndex(
        (product) => product.id === productId
      );
      console.log("productIndex", productIndex);

      if (req.file) {
        fs.unlink(products[productIndex].image, (err) => {
          if (err) {
            console.log(`failed to delete local image:${err}`);
          } else {
            console.log(`successfully deleted local image`);
          }
        });

        products[productIndex].image = `${imageDir}/${req.file.filename}`;
      }

      if (req.body.title) products[productIndex].title = req.body.title;
      if (req.body.price) products[productIndex].price = req.body.price;

      if (req.body.quantity)
        products[productIndex].quantity = req.body.quantity;
      if (req.body.description)
        products[productIndex].description = req.body.description;

      fs.writeFile("products.json", JSON.stringify(products), (err) => {
        res.send("update commited!!!");
      });
    });
  });
});

app.listen(8000, () => {
  console.log("Example app listening on port 8000!");
});
