
const express = require("express");
const bodyparser = require("body-parser");
const ejs = require("ejs");
const axios = require("axios");
const _ = require("lodash");

const app = express();
const port = process.env.PORT || 5000;

app.set("view engine", "ejs");
app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.static("public"));

const homeStartingContent = "I read a lot of books, but after finishing them, I often don't remember all the most important parts of the book. So, I started taking notes. Then I discovered that keeping my notes on physical books is tiresome. How many books will I store, considering the many books I have read? What if I misplace the book? Or what if I travel and want to brush through my notes? Therefore, here is my web app for storing my notes, book covers, and titles. This brings a solution to my problem.";

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
    // Fetch cover images for all posts
    for (const post of posts) {
        post.cover = await getCoverImageURL(post.isbn);
    }

    res.render("index", {
        homecontent: homeStartingContent,
        posts: posts
    });
});

app.get("/compose", (req, res) => {
    res.render("compose");
});

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

    posts.push(post);

    res.redirect("/");
});

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
    }) 
})
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});