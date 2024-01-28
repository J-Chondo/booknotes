const express = require("express");
const bodyparser = require("body-parser");
const ejs = require("ejs");
const axios = require("axios");
const _ = require("lodash");
const pg = require("pg");

const app = express();
const port = process.env.PORT || 5000;

// Set my view engine to ejs
app.set("view engine", "ejs");

// To access my body-parser
app.use(bodyparser.urlencoded({ extended: true }));

// To access my public folder e.g css style
app.use(express.static("public"));

// My introduction statement
const homeStartingContent = "I read a lot of books, but after finishing them, I often don't remember all the most important parts of the book. So, I started taking notes. Then I discovered that keeping my notes on physical books is tiresome. How many books will I store, considering the many books I have read? What if I misplace the book? Or what if I travel and want to brush through my notes? Therefore, here is my web app for storing my notes, book covers, and titles. This brings a solution to my problem.";

// Use the connection string directly
const db = new pg.Client({
    connectionString: "postgres://booknotesdb_user:Ln5wMZmeNAIHRxO98z2A0SPpE8JxmkMM@dpg-cmpj5uta73kc73bdt840-a/booknotesdb",
});

db.connect();



let posts = [];

// Function to fetch the cover image URL from the Open Library API
async function getCoverImageURL(isbn) {
    const apiUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;

    try {
        // Fetch the image to check for existence
        await axios.get(apiUrl);
        return apiUrl;
    } catch (error) {
        // If there's an error (e.g., 404 Not Found), return null
        console.error("Error fetching cover image:", error.message);
        return null;
    }
}

app.get("/", async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM posts ORDER BY date DESC");
        posts = result.rows;

        // Fetch cover images for all posts
        for (const post of posts) {
            post.cover = await getCoverImageURL(post.isbn);
        }

        res.render("index", {
            homecontent: homeStartingContent,
            posts: posts
        });

    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

// getting the compose route
app.get("/compose", (req, res) => {
    res.render("compose");
});

// route to push my post which are redirected to my home route

app.post("/compose", async (req, res) => {
    const isbn = req.body.postIsbn;
    const cover = await getCoverImageURL(isbn);

    const post = {
        cover: cover,
        title: req.body.postTitle,
        date: new Date(),
        recommendation: req.body.postRec,
        content: req.body.postBody,
        isbn: isbn
    };

    console.log("post")

    try {
        const result = await db.query(
            "INSERT INTO posts (cover, title, date, recommendation, content, isbn) VALUES($1, $2, $3, $4, $5, $6) RETURNING *",
            [post.cover, post.title, post.date, post.recommendation, post.content, post.isbn]
        );

        const newPost = result.rows[0];
        posts.push(newPost);
        // posts.push(post);

        res.redirect("/");

        console.log("results")

    } catch (error) {
        console.error("Error inserting data into the database:", error);
        res.status(500).send("Internal Server Error");
    }
});


// To view individual post in a separate page

app.get("/posts/:postName", (req, res)=>{
    const requestedTitle = _.lowerCase(req.params.postName);

    posts.forEach((post) =>{
        const storedTitle = _.lowerCase(post.title);

        if (storedTitle === requestedTitle) {
            res.render("posts", {
                cover: post.cover,
                title: post.title,
                date:  post.date,
                recommendation: post.recommendation,
                Isbn: post.Isbn,
                content: post.content


            })
        }
    }); 
});

// setting my port
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});