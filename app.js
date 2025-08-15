require("dotenv").config();

const express = require("express");
const app = express();
const path = require("path");
const passport = require("./config/passport");
const db = require("./config/db");
const userRouter = require("./routes/userRouter");
const adminRouter = require("./routes/adminRouter");
const session = require("express-session");
const methodOverride = require('method-override');
const flash =require('connect-flash')
const expressLayouts = require('express-ejs-layouts');
const Cart = require('./models/cartSchema');


db();

app.use((req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


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

app.use(async (req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.currentPath = req.path;
  next();
});


// app.use(async (req, res, next) => {
//   // console.log(req.session)
//   res.locals.user = req.session.user || null;
//   res.locals.currentPath = req.path;

//   if (req.session.user) {
//     try {
//       const cart = await Cart.findOne({ userId: req.session.user._id });
     
//       res.locals.cartCount = cart ? cart.items.length : 0;
//     } catch (error) {
//       console.error("Cart count middleware error:", error);
//       res.locals.cartCount = 0;
//     }
//   } else {
//     res.locals.cartCount = 0;
//   }

//   next();
// });



app.use(passport.initialize());
// app.use(passport.session());
app.use(methodOverride('_method'));
app.use(flash())
app.use(expressLayouts);


app.set("view engine", "ejs");
app.set('layout', 'layout'); 
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));



app.use("/user", userRouter);
app.use("/admin", adminRouter);




app.get("/error", (req, res) => {
  res.status(500).render("user/error", { message: "something went wrong!" });
});



app.use((req, res) => {
  res.status(404).render("user/pageNotFound");
});
app.use((req, res, next) => {
  if (!res.locals.pageTitle) {
    res.locals.pageTitle = 'Chettinad'; 
  }
  next();
});


app.listen(process.env.PORT, () => {
  console.log("server Running");
});
