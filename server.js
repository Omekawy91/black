const mysql = require("mysql2");
const express = require("express");

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());

// الاتصال بقاعدة البيانات باستخدام المتغيرات البيئية
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

// راوت بسيط لاختبار السيرفر
app.get("/", (req, res) => {
    res.send("Welcome to server Omar!");
});

// تشغيل السيرفر
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
