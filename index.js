const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const { userModel, AdminModel } = require("./modules/collection");
// const bcrypt = require("bcrypt")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const cookieParser = require("cookie-parser")
const app = express()

// Improved CORS configuration
// Update your CORS configuration
app.use(cors({
  origin: "https://counsellor-lovat.vercel.app",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],  // Added OPTIONS
  allowedHeaders: ["Content-Type", "Authorization", "x-csrf-token", "Origin", "Accept"]
}));

// Add this before your other routes to handle preflight requests
app.options('*', cors());
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())

mongoose.connect("mongodb+srv://inzuff:inzu664422@cluster0.cicya.mongodb.net/CRUD?retryWrites=true&w=majority&appName=Cluster0")

// Improved token verification middleware
const verifyUser = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: "No token available" });
  }
  
  jwt.verify(token, "jwt-secret-key", (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Error with token: " + err.message });
    }
    
    if (decoded.role === "admin") {
      req.user = decoded; // Store user info for later use
      next();
    } else {
      return res.status(403).json({ message: "Not authorized. Admin access required." });
    }
  });
}

// New endpoint to verify token without requiring admin role
app.get("/verify-token", (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: "No token available" });
  }
  
  jwt.verify(token, "jwt-secret-key", (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Invalid token" });
    }
    
    return res.status(200).json({ 
      message: "Token valid", 
      role: decoded.role,
      email: decoded.email 
    });
  });
});

app.post("/", (req, res) => {
  res.send("hello");
});
app.get("/logout",(req,res)=>{
  res.clearCookie("token")
  return res.json({Status:"Success"})
})
app.post("/signup", (req, res) => {
  const { name, email, password } = req.body;
  bcrypt.hash(password, 10)
    .then(hash => {
      AdminModel.create({ name, email, password: hash })
        .then(users => res.json("success"))
        .catch(err => res.status(500).json({ message: "Signup failed", error: err.message }));
    })
    .catch(err => res.status(500).json({ message: "Password hashing failed", error: err.message }));
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  try {
    AdminModel.findOne({ email: email })
      .then(user => {
        if (user) {
          bcrypt.compare(password, user.password, (err, result) => {
            if (result) {
              const token = jwt.sign({ email: user.email, role: user.role }, "jwt-secret-key", { expiresIn: "1d" });
              
              // Set cookie with additional options for better cross-domain support
              res.cookie("token", token, {
                httpOnly: true,
                secure: true, // For HTTPS
                sameSite: 'none', // For cross-domain
                maxAge: 24 * 60 * 60 * 1000 // 1 day
              });
              
              res.json({ Status: "success", role: user.role });
            } else {
              res.status(401).json({ message: "Incorrect password" });
            }
          });
        } else {
          res.status(404).json({ message: "No user found" });
        }
      })
      .catch(err => res.status(500).json({ message: "Login error", error: err.message }));
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

app.post("/newuser", async (req, res) => {
  userModel.create(req.body)
    .then(students => res.json(students))
    .catch(err => res.status(500).json({ message: "Failed to create user", error: err.message }));
});

app.get("/dashboard", verifyUser, (req, res) => {
  userModel.find({})
    .then(students => res.json(students))
    .catch(err => res.status(500).json({ message: "Failed to fetch dashboard data", error: err.message }));
});

app.get("/getuser/:id", (req, res) => {
  const id = req.params.id;
  userModel.findById({_id: id})
    .then(students => res.json(students))
    .catch(err => res.status(500).json({ message: "Failed to get user", error: err.message }));
});

app.put("/edited/:id", (req, res) => {
  const id = req.params.id;
  userModel.findByIdAndUpdate(
    { _id: id },
    { name: req.body.name, branch: req.body.branch, rollno: req.body.rollno }
  )
    .then(students => res.json(students))
    .catch(err => res.status(500).json({ message: "Failed to update user", error: err.message }));
});

app.delete("/delete/:id", (req, res) => {
  const id = req.params.id;
  userModel.findByIdAndDelete({ _id: id })
    .then(result => res.json(result))
    .catch(err => res.status(500).json({ message: "Failed to delete user", error: err.message }));
});

app.post("/subjects/:id/:semester", async (req, res) => {
  const { id, semester } = req.params;
  const { subject, marks, grade, category } = req.body;

  console.log("Received request to /subjects/:id/:semester");
  console.log("Params:", { id, semester });
  console.log("Body:", { subject, marks, grade, category });

  const validSemesters = ["sem1", "sem2", "sem3", "sem4", "sem5", "sem6", "sem7", "sem8"];
  if (!validSemesters.includes(semester)) {
    return res.status(400).json({ message: "Invalid semester" });
  }
  if (!subject) {
    return res.status(400).json({ message: "Subject is required" });
  }

  if (category !== "sem" && (marks === undefined || marks === null)) {
    return res.status(400).json({ message: "Marks is required" });
  }

  if (category === "sem" && !grade) {
    return res.status(400).json({ message: "Grade is required for 'sem' category" });
  }

  if (marks !== undefined && marks !== null && isNaN(marks)) {
    return res.status(400).json({ message: "Marks must be a number" });
  }

  let updateField;

  switch (category) {
    case "cat1":
      updateField = `${semester}.cat1`;
      break;
    case "cat2":
      updateField = `${semester}.cat2`;
      break;
    case "model":
      updateField = `${semester}.model`;
      break;
    case "sem":
      updateField = `${semester}.sem`;
      break;
    default:
      return res.status(400).json({ message: "Invalid category" });
  }

  try {
    const result = await userModel.updateOne(
      { _id: id },
      { $push: { [updateField]: { subject, marks, Grade: grade } } }
    );
    console.log("Update result:", result);
    res.json(result);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

app.get("/data/:id", async (req, res) => {
  try {
    const id = req.params.id;

    // Validate the ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const collection = await userModel.findOne({ _id: id });

    if (!collection) {
      return res.status(404).json({ message: "Collection not found" });
    }

    const validSemesters = ["sem1", "sem2", "sem3", "sem4", "sem5", "sem6", "sem7", "sem8"];
    validSemesters.forEach(semester => {
      if (!collection[semester]) {
        collection[semester] = { cat1: [], cat2: [], model: [], sem: [] };
      }
    });

    res.json([collection]);
  } catch (err) {
    console.error("Error fetching data:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
