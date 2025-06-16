const express = require("express");
const app = express();
const path = require("path");
const passport = require("./config/passport");
const db = require("./config/db");
const userRouter = require("./routes/userRouter");
const adminRouter = require("./routes/adminRouter");
const session = require("express-session");
const methodOverride = require('method-override');


db();

app.use((req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  next();
});

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 72 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));

app.set("view engine", "ejs");
// app.set("views",[path.join(__dirname,'views/user'),path.join(__dirname,'views/admin'),path.join(__dirname,"views/partials")])
console.log("Current directory:", process.cwd());
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

app.use("/", userRouter);
app.use("/user", userRouter);
app.use("/admin", adminRouter);

app.get("/error", (req, res) => {
  res.status(500).render("user/error", { message: "something went wrong!" });
});

app.use((req, res) => {
  res.status(404).render("user/pageNotFound");
});

app.listen(process.env.PORT, () => {
  console.log("server Running");
});
module.exports = app;
