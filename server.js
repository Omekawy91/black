const mysql = require("mysql2");
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());
app.use(cors());

const connection = mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "",
    database: process.env.DB_NAME || "weynak",
});

connection.connect(err => {
    if (err) {
        console.error("Database connection error:", err);
        return;
    }
    console.log("Connected to database!");
});

const blacklistedTokens = new Set();

app.post("/api/auth/signup", (req, res) => {
    const { username, email, password } = req.body;
    connection.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
        if (results.length > 0) return res.status(400).json({ message: "Email already exists" });
        const hashedPassword = await bcrypt.hash(password, 10);
        connection.query("INSERT INTO users (username, email, password) VALUES (?, ?, ?)", [username, email, hashedPassword], (err, result) => {
            if (err) return res.status(500).json({ message: "Error creating user", error: err });
            res.status(201).json({ message: "User created successfully" });
        });
    });
});

app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    connection.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
        if (results.length === 0) return res.status(400).json({ message: "Invalid credentials" });
        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
        res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
    });
});

app.post("/api/auth/logout", (req, res) => {
    const token = req.header("Authorization")?.split(" ")[1];
    if (!token) return res.status(400).json({ message: "No token provided" });
    blacklistedTokens.add(token);
    res.json({ message: "Logged out successfully" });
});

const checkBlacklist = (req, res, next) => {
    const token = req.header("Authorization")?.split(" ")[1];
    if (blacklistedTokens.has(token)) {
        return res.status(401).json({ message: "Token is invalid or expired" });
    }
    next();
};

app.post("/api/auth/forgot-password", (req, res) => {
    const { email, newPassword } = req.body;
    connection.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
        if (results.length === 0) return res.status(400).json({ message: "User not found" });
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        connection.query("UPDATE users SET password = ? WHERE email = ?", [hashedPassword, email], (err, result) => {
            if (err) return res.status(500).json({ message: "Error updating password", error: err });
            res.json({ message: "Password updated successfully" });
        });
    });
});

app.get("/", (req, res) => {
    res.send("Welcome to server Omar!");
});

const server = app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
        console.error(`Port ${port} is already in use`);
        process.exit(1);
    } else {
        console.error("Server error:", err);
    }
});

