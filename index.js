/**
 * Run using command nodemon index.js
 * Requirements to run beforehand:
 * npm install nodemon
 * npm install express
 * npm install bcrypt
 * npm install dotenv
 * npm install ejs
 * npm install mysql2
 * npm install express-session
 * npm install connect-mongo
 * Generate your own GUID for your node_session_secret
 * at: https://guidgenerator.com/
 * or: https://www.uuidgenerator.net/guid
 * or: https://www.guidgen.com/
 */

// Required for hiding passwords in .env security folder
require("./utils");
require("dotenv").config();

const express = require("express");

const port = process.env.PORT || 8080;

const app = express();

//required to keep users logged in to a session
const session = require("express-session");

// Timer to expire a user's login session after 1 hour
const expireTime = 60 * 60 * 1000;
// Required middleware to connect to MongoDB
const MongoStore = require("connect-mongo");

const database_name = "myFirstDatabase";
// Replaced temp hard-coded database with real database
const database = include("databaseConnection");
const db_utils = include("database/db_utils");
const db_users = include("database/users");
const db_admin = include("database/admin");

// MongoDB login info hidden in separate environment file
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
// This allows us to hide our session info
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;
const node_session_secret = process.env.NODE_SESSION_SECRET;

// allows us to use views
app.set("view engine", "ejs");

var mongoStore = MongoStore.create({
  mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@azuretoronto.abbb12m.mongodb.net/${database_name}`,
  crypto: {
    // Mongo secret session code goes here
    secret: mongodb_session_secret,
  },
});

//middleware that allows for encrypted passwords
const bcrypt = require("bcrypt");
//I think this is a random seed for creating hashed passwords? Check with Patrick
const saltRounds = 12;

// Part of login session requirements
app.use(
  session({
    secret: node_session_secret,
    store: mongoStore,
    saveUninitialized: false,
    resave: true,
  })
);

//required for post requests, allows the middleware to send data as an object
//Read more: https://stackoverflow.com/questions/23259168/what-are-express-json-and-express-urlencoded
app.use(express.urlencoded({ extended: false }));

app.use("/admin", adminAuthorization);
app.use("/members", sessionValidation);
app.use("/about", sessionValidation);
app.use("/tasklist", sessionValidation);

//the content of a button is only it's label. it can have on-click events
//but not action = post/get
//https://stackoverflow.com/questions/16036041/can-a-html-button-perform-a-post-request
app.get("/", (req, res) => {
  if (req.session.authenticated) {
    res.redirect("/members/name/" + req.session.username);
  } else {
    res.render("index");
  }
});

app.listen(port, () => {
  console.log("Node application listening on port " + port);
});

//req is obtained from the html
//req.query.color can be changed by html /about?color=blue
app.get("/about", (req, res) => {
  var color = req.query.color;
  res.render("about", { color: color });
});

// 1.2 req.query.missing comes from /submitEmail response.
// equivalent to localhost/3000/contact&missingPassword=1, where 1 is True
// 1.5 Combined /contact with /login and /submitEmail with /loggingin
app.get("/login", (req, res) => {
  var missingSomething = req.query.somethingMissing;
  res.render("login", { missing: missingSomething });
});

//Submitting the form leads to /submitUser with post request.
//Sends response (html) to page
app.get("/createUser", (req, res) => {
  var message = req.params.message;
  res.render("createUser", { message: message });
});

app.post("/submitUser", async (req, res) => {
  var nameInput = req.body.name;
  var emailInput = req.body.email;
  var passwordInput = req.body.password;

  var hashedPassword = bcrypt.hashSync(passwordInput, saltRounds);
  var success = await db_users.createUser({
    user: nameInput,
    email: emailInput,
    passwordHash: hashedPassword,
  });

  // TODO: Change this line to redirect to login with success line
  if (!nameInput) {
    res.render("createUser", { message: "name is required, daddy" });
  } else if (!emailInput) {
    res.render("createUser", { message: "email is required, daddy" });
  } else if (!passwordInput) {
    res.render("createUser", { message: "password is required, daddy" });
  } else if (success) {
    res.redirect("/login");
  } else {
    res.render("createUser", { message: "user already exists" });
  }
});

app.get("/tasklist", async (req, res) => {
  var user_id = req.session.user_id;
  var missingSomething = req.query.somethingMissing;
  var results = await db_utils.getTasks({
    user_id: user_id
  });

  if (missingSomething) {
    res.render("tasklist", { tasks: results, missing: missingSomething });
  // if (req.query.username != req.session.username && req.session.user_type == 2) {
  //   res.redirect('/');
  } else {
    res.render("tasklist", { tasks: results });
  }
});

function isValidSession(req) {
  if (req.session.authenticated) {
    return true;
  }
  return false;
}

app.post("/add", async (req, res) => {
  // var user_id = req.session.user_id;
  var descriptionInput = req.body.addTask;
  console.log(descriptionInput);
  if (!descriptionInput) {
    res.redirect("/tasklist?somethingMissing=1");
    return;
  } else {
    var newDescription = await db_utils.addTask({
      description: descriptionInput,
      user_id: req.session.user_id,
    });

    if (newDescription) {
      res.redirect("/tasklist");
      return;
    }
  }
});

function sessionValidation(req, res, next) {
  if (!isValidSession(req)) {
    req.session.destroy();
    res.redirect("/");
    return;
  } else {
    next();
  }
}

function isAdmin(req) {
  if (req.session.user_type == 'admin') {
    return true;
  }
  return false;
}

function adminAuthorization(req, res, next) {
  if (!isAdmin(req)) {
    res.status(403);
    res.render("errorMessage", { error: "Not Authorized" });
    return;
  } else {
    next();
  }
}

// Needs an async function because db involves waiting time
// for query to return data
app.get("/createTables", async (req, res) => {
  // Include just takes from outside classes
  const create_tables = include("database/create_tables");
  var success = create_tables.createTables();
  if (success) {
    // Render success page if connection.createTables() worked
    res.render("successMessage", { message: "created tables." });
  } else {
    res.render("errorMessage", { error: "Failed to create tables." });
  }
});

// app.get/contact page redirects here using form action='/submitEmail'
// Changed /submitEmail to /loggingIn
// 1.7 Added session info
app.post("/loggingIn", async (req, res) => {
  //pulls req from the body's 'email' field that was sent from a form
  // var username = req.body.name;
  var inputEmail = req.body.email;
  var password = req.body.password;

  if (!inputEmail) {
    res.redirect("/login?somethingMissing=email");
  } else if (!password) {
    res.redirect("/login?somethingMissing=password");
  } else {
    var results = await db_users.getUser({
      email: inputEmail,
      passwordHash: password,
    });

    // Sorry this is so nested, it's only because I followed step by step and things stacked up
    if (results) {
      if (results.length == 1) {
        if (bcrypt.compareSync(password, results[0].password)) {
          req.session.authenticated = true;
          req.session.username = results[0].username;
          req.session.user_id = results[0].user_id;
          req.session.user_type = results[0].type;
          req.session.cookie.maxAge = expireTime;
          if (req.session.user_type == 'user') {
            res.redirect("/members/name/" + results[0].username);
          } else {
            res.redirect("/admin");
          }
        }
      } else if (results.length > 1) {
        console.log(
          "invalid number of users matched: " +
            results.length +
            " (expected 1)."
        );
        res.redirect("/login?somethingMissing=invalidEntry");
      }
    } else {
      // If user/password not found:
      res.redirect("/login?somethingMissing=userNotExist");
    }
  }
});

app.get("/members", (req, res) => {
  if (results[0].type == 2) {
    res.redirect("/members/name/" + results[0].username);
    return
  } else {
    res.redirect("/admin" + results[0].username);
    return
  }
});

app.get("/members/name/:username", (req, res) => {
  var nameInput = req.session.username;
  var randomInt = Math.floor(Math.random() * 3 + 1);
  res.render("members", {
    data: { username: nameInput, randomInt: randomInt },
  });
});

app.get("/admin", async (req, res)=> {
  var results = await db_admin.getUsers();
  var username = req.session.username;
  res.render("adminUserView", {username: username, users: results});
});

app.get("/userTasks/:user_id", async (req, res) => {
  var userId = req.params.user_id;
  console.log("userId: " + userId);
  // TODO: Task list doesn't show up
  var taskResults = await db_admin.getUserTasks(userId);
  var usernameResults = await db_users.getUserById(userId);
  console.log("userResults: " + usernameResults[0].username);

  res.render("adminTaskView", {tasks: taskResults, username: usernameResults[0].username});
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

app.get("/back", (req, res) => {
  res.redirect("/");
});

app.post("/toAbout", (req, res) => {
  res.redirect("/about");
});

//sets standard directory to public folder (where gifs are)
app.use(express.static(__dirname + "/public"));

app.get("*", (req, res) => {
  res.status(404);
  console.log("Page not found, Daddy - 404");
  res.render("404");
});
