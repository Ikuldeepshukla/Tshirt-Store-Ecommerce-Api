const express = require("express");
require("dotenv").config();
const app = express();
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const fileupload = require("express-fileupload");

// for swagger documentation
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const swaggerDocument = YAML.load("./swagger.yaml");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// regular middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// temp-setup template engine
app.set("view engine", "ejs");

// cookies and file middleware
app.use(cookieParser());
app.use(
  fileupload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

// morgan middleware
app.use(morgan("tiny"));

// import all the routes here
const home = require("./routes/home");
const user = require("./routes/user");
const product = require("./routes/product");

// route middleware
app.use("/api/v1", home);
app.use("/api/v1", user);
app.use("/api/v1", product);

// export app js
module.exports = app;