
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import session from 'express-session';
import methodOverride from 'method-override';
import flash from 'connect-flash';
import expressLayouts from 'express-ejs-layouts';
import requestLogger from './middlewares/requestLogger.js';

import passport from './config/passport.js';
import db from './config/db.js';
import userRouter from './routes/userRouter.js';
import adminRouter from './routes/adminRouter.js';
import { setUserAndCartCount } from './middlewares/global.js';


import { fileURLToPath } from 'url';
import {dirname} from 'path';

const __filename=fileURLToPath(import.meta.url);
const __dirname=dirname(__filename);

db();

const app=express();
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(requestLogger);


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
app.use(flash());


app.use(setUserAndCartCount);


app.use(methodOverride('_method'));


app.use(expressLayouts);
app.set("view engine", "ejs");
app.set('layout', 'layout'); 
app.set("views", path.join(__dirname, "views"));


app.use(express.static(path.join(__dirname, "public")));


app.use((req, res, next) => {
  if (!res.locals.pageTitle) {
    res.locals.pageTitle = 'Chettinad';
  }
  next();
});

// Routes
app.use("/user", userRouter);
app.use("/admin", adminRouter);

app.get("/", (req, res) => {
  res.redirect("/user/home");
});

app.get("/error", (req, res) => {
  res.status(500).render("user/error", { message: "Something went wrong!" });
});

app.use((req, res) => {
  res.status(404).render("user/pageNotFound");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
