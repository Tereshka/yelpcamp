var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");

// root route
router.get("/", (req, res) => {
	res.render("landing");
});

//AUTH ROUTES
// show register form
router.get("/register", (req, res) => {
	res.render("register", {page: 'register'});
});

// sign up login
router.post("/register", (req, res) => {
	var newUser = new User({username: req.body.username, email: req.body.email});
	if(req.body.adminCode === "secretText123!") {
		newUser.isAdmin = true;
	}
	User.register(newUser, req.body.password, (err, user) => {
		if (err) {
			return res.render("register", {error: err.message});
		}
		passport.authenticate("local")(req, res, () => {
			req.flash("success",`Welcome you to join us, ${req.user.username}`);
			res.redirect("/campgrounds");
		});
	});
});

// show login form
router.get("/login", (req, res) => {
	res.render("login", {page: 'login'});
});

// login logic
router.post("/login", (req, res, next) => {
	passport.authenticate("local", {
		successRedirect: "/campgrounds"
		, failureRedirect: "/login"
		, failureFlash: true
		, successFlash: "Welcome back, " + req.body.username + "!"
	})(req, res);
});

// logout
router.get("/logout", (req, res) => {
	req.logout();
	req.flash("success", "Logged you out. See you soon!");
	res.redirect("/campgrounds");
});

// forgot password
router.get("/forgot", (req, res) => {
	res.render("forgot");
});

// sending email
router.post("/forgot", (req, res) => {
	async.waterfall([
		function(done){
			crypto.randomBytes(20, (err, buf) => {
				var token = buf.toString("hex");
				done(err, token);
			});
		},
		function(token, done){
			User.findOne( {email: req.body.email}, (err, user) => {
				if (err || !user){
					req.flash("error", "No account with that email address exists");
					return res.redirect("/forgot");
				}

				user.resetPasswordToken = token;
				user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

				user.save( err => {
					done(err, token, user);
				});
			});
		},
		function(token, user, done){
			var smtpTransport = nodemailer.createTransport({
				service: "Gmail",
				auth: {
					user: process.env.GMAIL,
					pass: process.env.GMAILPW
				}
			});
			var mailOptions = {
				to: user.email,
				from: process.env.GMAIL,
				subject: "Yelp Camp - Password Reset",
				text: "You've received this email, because you (or someone else) have requested password reset.\n\n"
					+ "Please, click on the following link, or paste it into your browser to complete the process (the link will expire in one hour):\n\n"
					+ "http://" + req.headers.host + "/reset/" + token + "\n\n"
					+ "If you did not request this, please ignore this email and your password will remain unchanged."
			};
			smtpTransport.sendMail(mailOptions, (err) => {
				req.flash("success", "An email has been sent to " + user.email + " with further instructions.");
				done(err, "done");
			});
		},
		function(err){
			// if (err) return next(err); // page is loading smth till the error
			res.redirect("/forgot");
		}
	]);
});

// show reset
router.get("/reset/:token", (req, res) => {
	User.findOne( {resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now()} } , (err, user) => {
		if (err || !user){
			req.flash("error", "Password reset token is invalid or has expired");
			return res.redirect("/forgot");
		}
		res.render("reset", {token: req.params.token});
	});
});

// reset password
router.post("/reset/:token", (req, res) => {
	async.waterfall([
		function(done){
			User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now()}}, (err, user) => {
				if (err || !user){
					req.flash("error", "Password reset token is invalid or has expired");
					return res.redirect("/forgot");
				}
				if(req.body.password === req.body.confirm){
					user.setPassword(req.body.password, err => {
						user.resetPasswordToken = undefined;
						user.resetPasswordExpires = undefined;
						user.save( err => {
							req.logIn(user, err => {
								done(err, user);
							});
						});
					});
				} else {
					req.flash("error", "Passwords do not match");
					return res.redirect("back");
				}
			});
		},
		function(user, done){
			var smtpTransport = nodemailer.createTransport({
				service: "Gmail",
				auth: {
					user: process.env.GMAIL,
					pass: process.env.GMAILPW
				}
			});
			var mailOptions = {
				to: user.email,
				from: process.env.GMAIL,
				subject: "Yelp Camp - Your password has been changed",
				text: "Good Day, " + user.username + "\n\n"
					+ "This is a conformation that the password for your account " + user.email + " has just changed."
			};
			smtpTransport.sendMail(mailOptions, (err) => {
				req.flash("success", "Your password has been changed");
				done(err, "done");
			});
		},
		function(err){
			res.redirect("/campgrounds");
		}
	]);
});


module.exports = router;