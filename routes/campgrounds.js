var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware"); // get index.js by default
var NodeGeocoder = require('node-geocoder');
 
var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
var geocoder = NodeGeocoder(options);

var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require("cloudinary");
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});
 


function escapeRegex(text) {
	return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

// index route
router.get("/", (req, res) => {
	var perPage = 9;
    var pageQuery = parseInt(req.query.page);
    var pageNumber = pageQuery ? pageQuery : 1;

	Campground.find(req.query.search 
		? {name: new RegExp(escapeRegex(req.query.search), 'gi')} 
		: {})
	.skip((perPage * pageNumber) - perPage)
	.limit(perPage)
	.sort({"createdAt": -1})
	.exec((err, camps) => {
		if (err || !camps) {
			console.log(camps);
			req.flash("error", "Sorry, no such campgrounds");
			return res.redirect("/campgrounds");
		} else {
			Campground.count().exec( (err, count) => {
				if(err){
					req.flash("error", "Sorry, can't count");
					return res.redirect("/campgrounds");
				} else {
					res.render("campgrounds/index", {
						campgrounds: camps, 
						currentUser: req.user, 
						search: req.query.search ? req.query.search : false, 
						current: pageNumber,
		                pages: Math.ceil(count / perPage)
		            });
				}

			});
		}
	});
});

//create campground
router.post("/", middleware.isLoggedIn, upload.single("image"), (req, res) => {
	var camp = req.body.campground;

	if (camp.name.length == 0 
		|| (req.file && req.file.path.length == 0) 
		|| (camp.image && camp.image.length == 0) 
		|| camp.description.length == 0 
		|| camp.price.length == 0){
		req.flash("error", "Empty campgrounds are not allowed");
		res.redirect("/campgrounds/new");
	} else {
		// Searching address
		geocoder.geocode(req.body.location, function (err, data) {
		    if (err || !data.length) {
		      req.flash("error", "Invalid address");
		      return res.redirect("back");
		    }
		    var lat = data[0].latitude;
		    var lng = data[0].longitude;
		    var location = data[0].formattedAddress;

		    var newCamp = {
				name: camp.name
				, image: camp.image
				, description: camp.description
				, price: camp.price
				, lat: lat
				, lng: lng
				, location: location
				, author: {
					id: req.user._id,
					username: req.user.username
				}
			};

			if(req.file){
				// Uploading image
				cloudinary.v2.uploader.upload(req.file.path, {folder: "yelp_camp_photoes"}, (err, result) => {
					if (err) {
						console.log(err);
					} else {
					  	newCamp.image = result.secure_url;
					  	newCamp.imageId = result.public_id;
						Campground.create(newCamp, (err, camp) => {
							if(err) {
								console.log(err)
							} else {
								req.flash("success", "Campground was created");
								res.redirect("/campgrounds");
							}
						});
					}
				});
			} else {
				Campground.create(newCamp, (err, camp) => {
					if(err) {
						console.log(err)
					} else {
						req.flash("success", "Campground was created");
						res.redirect("/campgrounds");
					}
				});
			}	    
		});
	}	
});

router.get("/new", middleware.isLoggedIn, (req, res) => {
	res.render("campgrounds/new");
});

router.get("/:id", (req, res) => {
	
	Campground.findById(req.params.id).populate("comments").exec((err, camp) => {
		if (err || !camp) {
			req.flash("error", "Campground not found");
			return res.redirect("/campgrounds");
		} else {
			res.render("campgrounds/show", {campground: camp});
		}
	});
	
});

//EDIT
router.get("/:id/edit", middleware.checkCampOwner, (req, res) => {
		Campground.findById(req.params.id, (err, camp) => {
			if (err || !camp) {
				req.flash("error", "Campground not found");
				return res.redirect("/campgrounds");
			} else {
				res.render("campgrounds/edit", {campground: camp});
			}
		});
});

//UPDATE
router.put("/:id", middleware.checkCampOwner,  upload.single("image"), (req, res) => {
	geocoder.geocode(req.body.location, (err, data) =>{
	    if (err || !data.length) {
	      req.flash('error', 'Invalid address');
	      return res.redirect('back');
	    }
	    req.body.campground.lat = data[0].latitude;
	    req.body.campground.lng = data[0].longitude;
	    req.body.campground.location = data[0].formattedAddress;

		Campground.findById(req.params.id, async (err, camp) => {
			if ( err || !camp ){
				req.flash("error", err.message);
				return res.redirect("/campgrounds");
			} else {
				if( req.body.campground.name.length <1 
					|| req.body.campground.description.length <1
					|| req.body.campground.price.length <1
					|| (req.file && req.file.path.length == 0) 
					|| (req.body.campground.image && req.body.campground.image.length == 0) ){
					req.flash("error", "Empty campgroungs are not allowed");
					return res.redirect("back");
				}

				camp.lat = req.body.campground.lat;
	    		camp.lng = req.body.campground.lng;
	    		camp.location = req.body.campground.location;
	    		camp.name = req.body.campground.name;
	    		camp.description = req.body.campground.description;
	    		camp.price = req.body.campground.price;

				if(req.file){
					try{
						if(camp.imageId != null && camp.imageId.length > 0){
							await cloudinary.v2.uploader.destroy(camp.imageId);
						}	
	                  	var result = await cloudinary.v2.uploader.upload(req.file.path, {folder: "yelp_camp_photoes"});
						camp.imageId = result.public_id;
	                 	camp.image = result.secure_url;
					} catch(err){
						req.flash("error", err.message);
						return res.redirect("back");	
					}
				} else {
					if(camp.imageId != null && camp.imageId.length > 0){
						await cloudinary.v2.uploader.destroy(camp.imageId);
					}
					camp.image = req.body.campground.image;
					camp.imageId = null;
				}
				
				camp.save();
				req.flash("success", "Campground was updated");
				res.redirect("/campgrounds/" + req.params.id);
			}
		});
	});
});

// DELETE
router.delete("/:id", middleware.checkCampOwner, (req, res) => {
	Campground.findById(req.params.id, async (err, camp) => {
		if(err) {
			return res.redirect("/campgrounds");
		}
		try {
			if(camp.imageId != null) {
				await cloudinary.v2.uploader.destroy(camp.imageId);
			}
			camp.remove();
			req.flash("success", "Campground was deleted");
			res.redirect("/campgrounds/");
		} catch(err) {
			req.flash("error", err.message);
			return res.redirect("back");	
		}	
	});
});

module.exports = router;