const mongoose = require("mongoose");

let connectionPromise = null;

const connectDB = async () => {
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    if (connectionPromise) {
        return connectionPromise;
    }

    const uri = process.env.MONGODB_URI;

    if (!uri) {
        throw new Error("MONGODB_URI is not configured.");
    }

    console.log(
        "MONGODB_URI HOST:",
        uri.split("@")[1] || "CONFIGURED"
    );

    connectionPromise = mongoose.connect(uri)
        .then(() => {
            console.log("✅ MongoDB Connected Successfully");
            console.log("Database Name:", mongoose.connection.name);
            return mongoose.connection;
        })
        .catch((error) => {
            connectionPromise = null;
            console.error("❌ MongoDB Connection Error:", error.message);
            throw error;
        });

    return connectionPromise;
};

module.exports = connectDB;
