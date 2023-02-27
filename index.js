/**
 * Requirements to run beforehand:
 * npm install nodemon
 * npm install express
 * npm install bcrypt
 * npm install dotenv
 * npm install ejs
 * npm install express-session
 * npm install connect-mongo
 * Generate your own GUID for your node_session_secret
 * at: https://guidgenerator.com/
 * or: https://www.uuidgenerator.net/guid
 * or: https://www.guidgen.com/
 */

// Required for hiding passwords in .env security folder
require('dotenv').config();

const express = require("express");
const port = process.env.PORT || 3000;

const app = express();

//required to keep users logged in to a session
const session = require("express-session");

// Timer to expire a user's login session after 1 hour
const expireTime = 60 * 60 * 1000;
// Required middleware to connect to MongoDB
const MongoStore = require("connect-mongo");

// MongoDB login info hidden in separate environment file
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
// This allows us to hide our session info
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;
const node_session_secret = process.env.NODE_SESSION_SECRET;

const database_name = "myFirstDatabase";
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
//temp substitute for database
var users = [];

//required for post requests, allows the middleware to send data as an object
//Read more: https://stackoverflow.com/questions/23259168/what-are-express-json-and-express-urlencoded
app.use(express.urlencoded({ extended: false }));

//the content of a button is only it's label. it can have on-click events
//but not action = post/get
//https://stackoverflow.com/questions/16036041/can-a-html-button-perform-a-post-request
// app.get("/", (req, res) => {
//   res.send(`<h1>Welcome Daddy!</h1>
//     <form action='/createUser' method='get'>
//         <button>Sign up</button>
//     </form>
//     <form action='/login' method='get'>
//         <button>Log in</button>
//     </form>
//   `);
// });

app.get("/", (req, res) => {
  res.render("index");
});

// used for building html pages as we go
app.set('view engine', 'ejs');

app.get('/about', (req,res) => {
  var color = req.query.color;
  if(!color) {
    color = "black";
  }
})

app.listen(port, () => {
  console.log("Node application listening on port " + port);
});

//req is obtained from the html
//req.query.color can be changed by html /about?color=blue
app.get("/about", (req, res) => {
  if (!req.session.authenticated) {
    res.redirect("/");
  }
  var color = req.query.color;
  html = `<form action ='/back' method='get'>
          <button>Back</button>
        </form>`;
  res.send(
    "<h1 style ='color:" + color + ";'>Site by Gabriel Fairbairn</h1>" + html
  );
});

// To change location of view files to a different folder than views
// app.set('views', path.join(__dirname, '/views'));

// 1.2 req.query.missing comes from /submitEmail response.
// equivalent to localhost/3000/contact&missingPassword=1, where 1 is True
// 1.5 Combined /contact with /login and /submitEmail with /loggingin
app.get("/login", (req, res) => {
  var missingName = req.query.missingName;
  var missingEmail = req.query.missingEmail;
  var missingPassword = req.query.missingPassword;
  var notFound = req.query.notFound;

  var html = `
    Log in:
    <form action='/loggingIn' method = 'post'>
        <input name ='name' type='text' placeholder='name'>
        <input name ='email' type='text' placeholder='email'>
        <input name ='password' type='password' placeholder='password'></input>
        <button>Submit</button>
        </form>
        <form action ='/back' method='get'>
          <button>Back</button>
        </form>
    `;
  if (missingEmail) {
    //add html element to response data
    html += "email is required, Daddy";
  } else if (missingName) {
    //add html element to response data
    html += "name is required, Daddy";
  } else if (missingPassword) {
    //add html element to response data
    html += "password is required, Daddy";
  } else if (notFound) {
    html += "user login not found, Daddy";
  }
  res.send(html);
});

//Submitting the form leads to /submitUser with post request.
//Sends response (html) to page
app.get("/createUser", (req, res) => {
  var html = `
    <h2>Sign up:</h2>
    <form action='/submitUser' method='post'>
    <input name='name' type='text' placeholder='name'>
    <input name='email' type='text' placeholder='email'>
    <input name='password' type='password' placeholder='password'>
    <button>Submit</button>
    </form>
    <form action ='/back' method='get'>
    <button>Back</button>
    </form>
    `;
  res.send(html);
});

app.post("/submitUser", (req, res) => {
  var nameInput = req.body.name;
  var emailInput = req.body.email;
  var passwordInput = req.body.password;

  //Hashes the password instead of using pushing raw password
  var hashedPassword = bcrypt.hashSync(passwordInput, saltRounds);
  //push email/password as key, value pair to users[] list? doublecheck with Patrick
  //Example output: nerdslayer0: $2b$12$vrAnfJHQJw3sKmnn3yUejO4bm5q/DhI9nK4Kq7s4bRxuvS12Trwi2
  users.push({ name: nameInput, email: emailInput, password: hashedPassword });
  console.log(users);

  //adds list items to html and sends it to the page
  // var usershtml = "";
  // for (i = 0; i < users.length; i++) {
  //   usershtml +=
  //     "<li>" +
  //     users[i].name +
  //     ": " +
  //     users[i].email +
  //     ": " +
  //     users[i].password +
  //     "</li>";
  // }
  // var html = "<ul>" + usershtml + "</ul>";
  res.redirect("/login");
});

// app.get/contact page redirects here using form action='/submitEmail'
// Changed /submitEmail to /loggingIn
// 1.7 Added session info
app.post("/loggingIn", (req, res) => {
  //pulls req from the body's 'email' field that was sent from a form
  var email = req.body.email;
  var name = req.body.name;
  var password = req.body.password;

  console.log(email, name, password);
  if (!email) {
    res.redirect("/login?missingEmail=1");
  }
  //   else if (!name) {
  //     res.redirect("/login?missingName=1");
  //   }
  else if (!password) {
    res.redirect("/login?missingPassword=1");
  } else {
    // res.send("Thank you for subscribing, " + name + "!");

    // Empties the list of previously logged in users?
    var usershtml = "";
    // Loop through list of users, if there is a match,
    // use bcrypt to compare password with encrypted password
    for (i = 0; i < users.length; i++) {
      if (users[i].email == email) {
        if (bcrypt.compareSync(password, users[i].password)) {
          req.session.authenticated = true;
          req.session.username = name;
          req.session.cookie.maxAge = expireTime;
          res.redirect("/members/name/" + name);
          return;
        }
      }
    }
    // If user/password not found:
    res.redirect("/login?notFound=1");
  }
});

app.get("/members/name/:name", (req, res) => {
  var nameInput = req.params.name;
  console.log("name input: " + nameInput);
  var randomInt = Math.floor(Math.random() * 3 + 1);
  if (!req.session.authenticated) {
    res.redirect("/login");
  }
  var html =
    `
    Welcome, "` +
    nameInput +
    `"-daddy!
    <form action='/logout' method='/get'><button>Log out</button></form>
    `;
  console.log(randomInt);
  if (randomInt == 1) {
    html += `Today\'s Mood: <br />Dank... <br /><img src='/dank.jpg' style='width:250px;'>`;
  } else if (randomInt == 2) {
    html += `Today\'s Mood: <br />What're u lookin at <br /><img src='/gebmeme.jpg' style='width:250px;'>`;
  } else if (randomInt == 3) {
    html += `Today\'s Mood: <br />Party til we die! <br /><img src='/coffin-dance.gif' style='width:250px;'>`;
  }

  html += `<form action ='/toAbout' method='post'>
  <button>More Info</button>
  </form>`;
  res.send(html);
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

//:id is a parameter for the request
app.get("/cat/:id", (req, res) => {
  var cat = req.params.id;

  if (cat == 1) {
    res.send("Fluffy: <img src='/fluffy.gif' style='width:250px;'>");
  } else if (cat == 2) {
    res.send("Socks: <img src='/socks.gif' style='width:250px;'>");
  } else {
    res.send("Invalid cat id: " + cat);
  }
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
  res.send("<img src='/404.gif' style ='width:500px;'>");
});
