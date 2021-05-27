const express = require("express");
require("./db/mongoose");
const path = require("path");
const hbs = require("hbs");
const taskRouter = require("./routers/task");
const userRouter = require("./routers/user");

const app = express();
//
const publicPath = path.join(__dirname, "../public");
const viewsPath = path.join(__dirname, "../templates/views");
const partialsPath = path.join(__dirname, "../templates/partials");
//

app.set("view engine", "hbs");
app.set("views", viewsPath);
hbs.registerPartials(partialsPath);
//
app.use(express.static(publicPath));
//
app.use(express.json());
//
app.use(taskRouter);
app.use(userRouter);
//
module.exports = app;
