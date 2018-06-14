var express = require("express");
var router = express.Router({mergeParams: true});
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var middleware = require("../middleware"); 

// new comment
router.get("/new",middleware.isLoggedIn, (req, res) => {
	Campground.findById(req.params.id, (err, camp) => {
		if (err) {
			console.log(err);
		} else {
			res.render("comments/new", {campground: camp});
		}
	});
	
});

// comment create
router.post("/", middleware.isLoggedIn, (req, res) => {
	Campground.findById(req.params.id, (err, camp) => {
		if (err) {
			console.log(err);
			req.flash("error", "Campground not found");
			return res.redirect("/campgrounds/");
		} else {
			Comment.create(req.body.comment, (err, comment) => {
				if(err) {
					console.log(err);
					req.flash("error", "Some problems with comments");
				} else {
					if ( comment.text.length == 0 ){
						req.flash("error", "Empty comments are not allowed");
						res.redirect("/campgrounds/"+req.params.id);
					} else {
						comment.author.id = req.user._id;
						comment.author.username = req.user.username;
						comment.save();
						camp.comments.push(comment);
						camp.save();
						req.flash("success", "Comment was added");
						res.redirect("/campgrounds/"+req.params.id);
					}
				}
			});
		}
	});
});

//EDIT
// router.get("/:comment_id/edit", middleware.checkCommentOwner, (req, res) => {
// 	Campground.findById(req.params.id, (err, camp) => {
// 		if(err || !camp){
// 			req.flash("error", "Campground not found");
// 			return res.redirect("back");
// 		}
// 		Comment.findById(req.params.comment_id, (err, comment) => {
// 			if(err){
// 				return res.redirect("back");
// 			} else {
// 				res.render("comments/edit", {campground_id: req.params.id, comment: comment});
// 			}
// 		});
// 	});
// });

//UPDATE, remove findAndUpdate coz of updating despite of errors
router.put("/:comment_id", middleware.checkCommentOwner, (req, res) => {
	Comment.findById(req.params.comment_id, (err, comment) => {
		if(err || req.body.comment.text.length < 1) {
			req.flash("error", "Empty comments are not allowed");
			return res.redirect("back");
		} else {
			comment.text = req.body.comment.text;
			comment.save();
			req.flash("success", "Comment was edited");
			res.redirect("/campgrounds/" + req.params.id);
		}
	});
});

// DELETE
router.delete("/:comment_id", middleware.checkCommentOwner, (req, res) => {
	Comment.findByIdAndRemove(req.params.comment_id, (err, comment) => {
		if(err) {
			res.redirect("back");
		} else {
			req.flash("success", "Comment was deleted");
			res.redirect("/campgrounds/" + req.params.id);
		}
	});
});

module.exports = router;