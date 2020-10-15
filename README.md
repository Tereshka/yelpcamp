# YelpCamp [LIVE DEMO](https://tereshka-yelp-camp.herokuapp.com/)

This is a final project for Web BootCamp on [Udemy](https://www.udemy.com/the-web-developer-bootcamp/learn/v4/overview)

The yelpcamp uses MongoDB for storage information about users, campgrounds and comments.

The application has an authorization by Passport and Passport-Local. There are already two users, one of them has admin role. For creating admin role was used a secret password, which  you have to put while signing up. Nodemailer was used for changing password, if you have forgotten yours.

Administrator:
```
login: Admin
password: pass
```

User:
```
login: user
password: user
```

Every user can add campgrounds, edit their campgrounds and add comments to any campgrounds. Also a user can edit his profile information.
Administrator can edit any campgrounds, comments and profiles.

When you add a new campground you need to put an information about it's location. So, the app uses Google Maps API for place searching and for showing it on the map.
You can add campground's picture by inserting a simple url or by picking a photo from your computer. It uses Cloudinary API for storing photos. 

The whole variables for the project (.env file):
```
MONGODB_URI= url of mongoDB

GEOCODER_API_KEY= a Google Maps API key for backend part

GMAIL= the main address, which sends you emails about reseting a password

GMAILPW= password from GMAIL variable

CLOUDINARY_NAME= username from Cloudinary API

CLOUDINARY_API_KEY= Cloudinary API key

CLOUDINARY_API_SECRET= Cloudinary API secret
```
