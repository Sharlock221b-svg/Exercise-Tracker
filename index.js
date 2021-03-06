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
//defining schema
const user_track = new mongoose.Schema({
  username: { type: String, required: true },
  log: [
    {
      duration: { type: Number },
      description: { type: String },
      date: { type: String },
    },
  ],
});
const userTrack = mongoose.model("user_track", user_track);

//handeling index page
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app
  .route("/api/users")
  .post((req, res) => {
    //saving username in db
    userTrack.create({ username: req.body.username }, (err, data) => {
      if (err) console.log(err);
      else res.json({ _id: data._id, username: data.username });
    });
  })
  .get((req, res) => {
    //querying for all the users data
    userTrack.find({}, { log: 0 }, (err, data) => {
      err ? res.json(err) : res.json(data);
    });
  });
//adding logs in the db
app.post("/api/users/:_id/exercises", (req, res) => {
  let obj = {
    description: req.body.description,
    duration: parseInt(req.body.duration),
    date: req.body.date ? new Date(req.body.date) : new Date(),
  };
  //checking for the Id
  const checkId = new Promise((resolve, reject) => {
    userTrack.findByIdAndUpdate(
      req.params._id,
      { $push: { log: obj } },
      { new: true },
      (err, data) => {
        err || !data ? reject("Id not Found") : resolve(data.username);
      }
    );
  });

  checkId
    .then((name) => {
      res.json({
        _id: req.params._id,
        username: name,
        date: obj.date.toDateString(),
        duration: obj.duration,
        description: obj.description,
      });
    })
    .catch((err) => res.json(err));
});

app.get("/api/users/:_id/logs", (req, res) => {
  //finding tha users tracks
  const getData = new Promise((resolve, reject) => {
    userTrack.findById(
      req.params._id,
      { __v: 0, log: { _id: 0 } },
      (err, data) => {
        (err || !data) ? reject("Sporty Fucking Spice") : resolve(data);
      }
    );
  });

  getData
    .then((data) => { //processing various queries
      if (req.query.from !== undefined && req.query.from !== "") { //from date constaint
        const from = new Date(req.query.from);
        data.log = data["log"].filter((x) => {
          const date = new Date(x.date);
          return date >= from;
        });
      } //to date constraints
      if (req.query.to !== undefined && req.query.to !== "") {
        const to = new Date(req.query.to);
        data.log = data["log"].filter((x) => {
          const date = new Date(x.date);
          return date <= to;
        });
      } // applying limit
      if (req.query.limit !== undefined && req.query.limit !== "") {
        const limit = parseInt(req.query.limit);
        data.log = data.log.slice(0, limit);
      }
      data.log = data.log.map((x) => {
        x.date = new Date(x.date).toDateString(); //converting date
        return x;
      })
      
      res.json({
        _id: data._id,
        username: data.username,
        count: data.log.length,
        log: data.log
      });
    })
    .catch((err) => res.json(err));
});
//establishing connection
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});