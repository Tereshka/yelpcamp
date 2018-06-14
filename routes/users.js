var express = require("express");
var router = express.Router();
var middleware = require("../middleware"); 
var User = require("../models/user");
var Campground = require("../models/campground");

// USER PROFILE
router.get("/:username", (req, res) => {
	User.findOne({username: req.params.username}, (err, user) => {	
		if(err || !user){
			req.flash("error", "User not found");
			return res.redirect("back");
		}

		Campground.find().where("author.id").equals(user.id).exec(function(err, campgrounds){
			if(err){
				req.flash("error", "Campgrounds not found");
				return res.redirect("back");
			}
			res.render("users/show", {user, campgrounds});
		});
		
	});
});

//EDIT
router.get("/:username/edit", middleware.checkProfileOwner, (req, res) => {
	User.findOne({username: req.params.username}, (err, user) => {
		if (err || !user) {
			req.flash("error", "No permission");
			return res.redirect("/campgrounds");
		} else {
			res.render("users/edit", {user});
		}
	});
});

//UPDATE
router.put("/:username", middleware.checkProfileOwner, (req, res) => {
	User.findOneAndUpdate({username: req.params.username}, req.body.user, (err, user) => {
		if(err || !user) {
			req.flash('error', "Something went wrong");
			return res.redirect("back");
		} else {
			req.flash("success", "Profile information was updated");
			res.redirect("/users/" + user.username);
		}
	});
});

module.exports = router;