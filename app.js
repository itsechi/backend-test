require("dotenv").config();
const express = require("express");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const session = require("express-session");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
const PORT = 5000;
const JWT_SECRET = "your_jwt_secret"; // Replace with your secret

// Configure CORS
const corsOptions = {
  origin: "http://localhost:5173", // Change this to your frontend URL
  credentials: true,
};
app.use(cors(corsOptions));

// Session setup
app.use(
  session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: true,
    // cookie: {
    //   secure: true, // true if using HTTPS
    //   httpOnly: true,
    //   sameSite: "none", // required for cross-domain cookies
    // },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Passport Google OAuth setup
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: process.env.CALLBACK_URL,
    },
    function (accessToken, refreshToken, profile, done) {
      // Create a JWT token
      const token = jwt.sign(
        { id: profile.id, displayName: profile.displayName },
        JWT_SECRET,
        { expiresIn: "1h" }
      );
      console.log(token);
      return done(null, { profile, token });
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// Routes
app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["https://www.googleapis.com/auth/plus.login"],
  })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    // Send the token to the frontend
    res.redirect(`http://localhost:5173/?token=${req.user.token}`);
  }
);

app.get("/api/user", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: "Token is invalid or expired" });
    }
    res.json({ id: decoded.id, displayName: decoded.displayName });
  });
});

app.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("http://localhost:5173");
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
