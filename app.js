require("dotenv").config();

var express= require("express");
var app = express();
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var passport = require("passport");
var PassportLocal = require("passport-local");
var commentRoutes = require("./routes/comments");
var campgroundRoutes = require("./routes/campgrounds");
var userRoutes = require("./routes/users");
var authRoutes = require("./routes/index");
var methodOveride = require("method-override");
var flash = require("connect-flash");

var User = require("./models/user");
var seedDB = require("./seeds");
//seedDB();

const databaseUrl = process.env.MONGODB_URI || "mongodb://localhost/yelpcamp";
mongoose.connect(databaseUrl);
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(methodOveride("_method"));
app.use(flash());

app.locals.moment = require('moment');
app.locals.api_key = process.env.GEOCODER_API_KEY; //Google API
app.locals.adminCode = "secretText123!";

// PASSPORT configuration
app.use(require("express-session")({
	secret: "my secret text!",
	resave: false,
	saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new PassportLocal(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
	res.locals.currentUser = req.user;
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
	res.locals.adminCode = "secretText123!";
	next();
});

app.use("/", authRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);
app.use("/users", userRoutes);

app.listen(process.env.PORT || 3001, function(){
	console.log("server starts");
});
