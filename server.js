var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var exphbs = require("express-handlebars");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = process.env.PORT || 3000;



// Initialize Express
var app = express();

// Configure middleware

// Handlebars
app.engine(
  "handlebars",
  exphbs({
    defaultLayout: "main"
  })
);
app.set("view engine", "handlebars");

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI);

// Routes
// require("./routes/routes")(app);
// A GET route for scraping the echoJS website
app.get("/", function(req, res) {
  // First, we grab the body of the html with request
  axios.get("https://mynintendonews.com/").then(function(response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    // Now, we grab every h2 within an article tag, and do the following:
    $("article").each(function(i, element) {
      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this)
        .children("header")
        .children("h1")
        .children("a")
        .text();
      result.link = $(this)
        .children("header")
        .children("h1")
        .children("a")
        .attr("href");
      result.description = $(this)
        .children(".item__content")
        .children(".excerpt")
        .children("p")
        .text();
      // Create a new Article using the `result` object built from scraping
      db.Article.create(result)
        .then(function(dbArticle) {
          // View the added result in the console
          console.log(dbArticle);
        })
        .catch(function(err) {
          // If an error occurred, send it to the client
          console.log(err);
        });
    });

    db.Article.find({})
    .populate("comments")
    .then(function(articles){
      res.render("index",{Article : articles})
    })
  });
});

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  // TODO: Finish the route so it grabs all of the articles
  db.Article.find({},function(err,data){
    res.json(data);
  })
});

// Route for grabbing a specific Article by id, populate it with it's comment
app.get("/articles/:id", function(req, res) {
  // TODO
  // ====
  // Finish the route so it finds one article using the req.params.id,
  // and run the populate method with "comment",
  // then responds with the article with the comment included
  db.Article.findOne({"_id": req.params.id})
  .then(function(article){
    res.json(article)
  })
});

// Route for saving/updating an Article's associated Comment
app.post("/articles/:id", function(req, res) {
  // TODO
  // ====
  db.Comment.create(req.body)
    .then(function(dbComment) {
      // If a Comment was created successfully, find one User (there's only one) and push the new Comment's _id to the User's `comments` array
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Article.findOneAndUpdate({_id: req.params.id}, { $push: {comments: dbComment._id }}, { new: true });
    })
    .then(function(dbArticle) {
      // If the User was updated successfully, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurs, send it back to the client
      res.json(err);
    });
  // save the new comment that gets posted to the Comments collection
  // then find an article from the req.params.id
  // and update it's "comment" property with the _id of the new comment
  db.Article.update({})
});

app.delete("/articles/:id", function(req,res){
  db.Article.deleteOne({_id: req.params.id},function(err){
    if(err)throw err;

    res.redirect("/")
  })
})

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});