const mongoose = require("mongoose");
require("dotenv").config();

const fs = require("fs");
const path = require("path");

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const rechargeRoutes = require("./routes/rechargeRoutes");
const withdrawRoutes = require("./routes/withdrawRoutes");
const adminRoutes = require("./routes/adminRoutes");
const paymentSettingRoutes = require("./routes/paymentSettingRoutes");
const referralRoutes = require("./routes/referralRoutes");
const productRoutes = require("./routes/productRoutes");
const productIncomeRoutes = require("./routes/productIncomeRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");

const connectDB = require("./config/db");

console.log("PRODUCT ROUTES LOADED");

// ===============================
// APP ROOT
// ===============================

const APP_ROOT = process.cwd();

console.log("APP_ROOT =", APP_ROOT);

const app = express();

// ===============================
// QR PATH
// ===============================

const qrPath = path.join(
    APP_ROOT,
    "uploads",
    "qr",
    "qr1.png"
);

console.log("QR Path =", qrPath);
console.log("QR Exists =", fs.existsSync(qrPath));

// ===============================
// MONGODB
// ===============================

connectDB();

mongoose.connection.once("open", () => {
    console.log(
        "Database Name:",
        mongoose.connection.name
    );
});

// ===============================
// SECURITY
// ===============================

// Helmet enabled.
// Content-Security-Policy is disabled because
// frontend currently uses inline CSS/JS and CDN resources.

app.use(
    helmet({
        contentSecurityPolicy: false
    })
);

// ===============================
// CORS
// ===============================

app.use(
    cors({
        origin: true,

        methods: [
            "GET",
            "POST",
            "PUT",
            "DELETE",
            "OPTIONS"
        ],

        allowedHeaders: [
            "Content-Type",
            "Authorization"
        ],

        credentials: true
    })
);

// ===============================
// BODY PARSERS
// ===============================

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);

// Payment gateway callbacks
app.use(
    express.text({
        type: [
            "text/plain",
            "text/*"
        ]
    })
);

// ===============================
// STATIC FILES
// ===============================

// Uploaded files
app.use(
    "/uploads",
    express.static(
        path.join(
            APP_ROOT,
            "uploads"
        )
    )
);

// Frontend files
app.use(
    express.static(
        path.join(
            APP_ROOT,
            "public"
        )
    )
);

// ===============================
// REGISTER PAGE
// ===============================

app.get(
    "/register",
    (req, res) => {

        res.sendFile(
            path.join(
                APP_ROOT,
                "public",
                "register.html"
            )
        );

    }
);

// ===============================
// API ROUTES
// ===============================

app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/user",
    userRoutes
);

app.use(
    "/api/recharge",
    rechargeRoutes
);

app.use(
    "/api/withdraw",
    withdrawRoutes
);

app.use(
    "/api/admin",
    adminRoutes
);

app.use(
    "/api/payment",
    paymentSettingRoutes
);

app.use(
    "/api/referral",
    referralRoutes
);

app.use(
    "/api/product",
    productRoutes
);

app.use(
    "/api/product-income",
    productIncomeRoutes
);

app.use(
    "/api/payment-gateway",
    paymentRoutes
);

app.use(
    "/api/leaderboard",
    leaderboardRoutes
);

// ===============================
// RATE LIMIT
// ===============================

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});

app.use(limiter);

// ===============================
// TEST / HEALTH ROUTES
// ===============================

app.get(
    "/",
    (req, res) => {

        res.json({
            success: true,
            message:
                "BRITANNIYA API Running Successfully"
        });

    }
);

app.get(
    "/render-test",
    (req, res) => {

        res.send(
            "RENDER BACKEND WORKING"
        );

    }
);

app.get(
    "/health",
    (req, res) => {

        res.status(200).json({
            success: true,
            status: "healthy"
        });

    }
);

// ===============================
// QR TEST
// ===============================

app.get(
    "/test-qr",
    (req, res) => {

        res.sendFile(qrPath);

    }
);

// ===============================
// PAYMENT SUCCESS
// ===============================

app.get(
    "/payment-success.html",
    (req, res) => {

        res.sendFile(
            path.join(
                APP_ROOT,
                "payment-success.html"
            )
        );

    }
);

// ===============================
// HELLO TEST
// ===============================

app.use(
    "/hello",
    (req, res) => {

        res.send(
            "HELLO WORKING"
        );

    }
);

// ===============================
// EXPORT EXPRESS APP
// ===============================

// IMPORTANT:
// Cloudflare Worker / start.js
// app.listen() karega.
//
// Yahan app.listen() MAT lagana.

module.exports = {
    app
};