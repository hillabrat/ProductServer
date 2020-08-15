const express = require("express");
const fs = require("fs");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");

app.use(bodyParser.json());

app.use(cors());

// search string in product's title
app.get("/products", (req, res) => {
  console.log("QUERY:", req.query);
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

// add new product
app.post("/products", (req, res) => {
  fs.readFile("products.json", (err, data) => {
    const products = JSON.parse(data);
    const title = req.body.title;
    const image = req.body.image;
    const quantity = req.body.quantity;
    const price = req.body.price;
    const description = req.body.description;
    products.push({
      id: products.length + 1,
      title: title,
      image: image,
      quantity: quantity,
      price: price,
      description: description,
    });
    fs.writeFile("products.json", JSON.stringify(products), (err) => {
      // console.log(err);
      res.send("YOU SUCCEED!!!");
    });
  });
});

//delete product by id
app.delete("/products/:id", (req, res) => {
  fs.readFile("products.json", (err, data) => {
    const products = JSON.parse(data);
    const productId = +req.params.id;
    const productIndex = products.findIndex(
      (product) => product.id === productId
    );
    products.splice(productIndex, 1);
    fs.writeFile("products.json", JSON.stringify(products), (err) => {
      res.send("YOU SUCCEED!!!");
    });
  });
});

//update product attributes
app.put("/products/:id", (req, res) => {
  fs.readFile("products.json", (err, data) => {
    const products = JSON.parse(data);
    const productId = +req.params.id;
    const productIndex = products.findIndex(
      (product) => product.id === productId
    );

    if (req.body.title) products[productIndex].title = req.body.title;
    if (req.body.price) products[productIndex].price = req.body.price;
    if (req.body.image) products[productIndex].image = req.body.image;
    if (req.body.quantity) products[productIndex].quantity = req.body.quantity;
    if (req.body.description)
      products[productIndex].description = req.body.description;

    fs.writeFile("products.json", JSON.stringify(products), (err) => {
      res.send("update commited!!!");
    });
  });
});

app.listen(8000, () => {
  console.log("Example app listening on port 8000!");
});
