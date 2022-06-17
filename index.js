const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();
const mongoose = require("mongoose");
const { check, validationResult } = require("express-validator");

app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//connecting mongoose to mongodb
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
//creating a schema for mongodb database
const user_data = new mongoose.Schema({
  username: { type: String, required: true },
  count: { type: Number, default: 0 },
  log: [
    {
      description: String,
      duration: Number,
      date: String,
    },
  ],
});
const userData = mongoose.model("user_data", user_data);

//handeling index page
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

//handeling request for creating a user
app.post("/api/users", (req, res) => {
  const name = req.body.username;
  userData.create({ username: name }, (err, data) => {
    if (err) console.error(err);
    return res.json({
      username: data.username,
      _id: data["_id"],
    });
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
