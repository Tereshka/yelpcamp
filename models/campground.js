var mongoose = require("mongoose");

var campgroundSchema = new mongoose.Schema({
	author: {
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		},
		username: String
	},
	name: String,
	image: String,
	imageId: {type: String, default: null},
	description: String,
	price: String,
	location: String,
	lat: Number,
	lng: Number,
	createdAt: {type: Date, default: Date.now},
	comments: [
      {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Comment"
      }
   ]
});

module.exports = mongoose.model("Campground", campgroundSchema);