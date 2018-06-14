var Campground = require("../models/campground");
var Comment = require("../models/comment");
var User = require("../models/user");

var middlewareObj = {};

middlewareObj.isLoggedIn = function(req, res, next){
	if(req.isAuthenticated()){
		return next();
	}
	req.flash("error", "Please, login first!");
	res.redirect("/login");
};

middlewareObj.checkCommentOwner = function(req, res, next){
	if(req.isAuthenticated()){
		Comment.findById(req.params.comment_id, (err, comment) => {
			if (err || !comment) {
				req.flash("error", "Comment not found");
				return res.redirect("back");
			} else {
				if(comment.author.id.equals(req.user._id) || req.user.isAdmin){
					next();
				} else {
					req.flash("error", "Permission denied");
					res.redirect("back");
				}
			}
		});
	} else {
		req.flash("error", "Please, login first!");
		res.redirect("back");
	}
};

middlewareObj.checkCampOwner = function(req, res, next){
	if(req.isAuthenticated()){
		Campground.findById(req.params.id, (err, camp) => {
			if (err || !camp) {
				req.flash("error", "Campground not found");
				return res.redirect("back");
			} else {
				if(camp.author.id.equals(req.user._id)  || req.user.isAdmin){
					next();
				} else {
					req.flash("error", "Permission denied");
					res.redirect("back");
				}
			}
		});
	} else {
		req.flash("error", "Please, login first!");
		res.redirect("back");
	}
};

middlewareObj.checkProfileOwner = function(req, res, next){
	if(req.isAuthenticated()){
		User.findById(req.user.id, (err, user) => {
			if (err || !user) {
				req.flash("error", "--User not found");
				return res.redirect("back");
			} else {
				if(user._id.equals(req.user.id)  || req.user.isAdmin){
					next();
				} else {
					req.flash("error", "Permission denied");
					res.redirect("back");
				}
			}
		});
	} else {
		req.flash("error", "Please, login first!");
		res.redirect("back");
	}
};


module.exports = middlewareObj;