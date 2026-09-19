const jwt = require("jsonwebtoken");

const adminAuth = (req, res, next) => {

    try {

        // Authorization Header Check
        const authHeader = req.headers.authorization;

        if (!authHeader) {

            return res.status(401).json({

                success: false,
                message: "Authorization Header Missing"

            });

        }

        // Token Format Check
        const token = authHeader.split(" ")[1];

        if (!token) {

            return res.status(401).json({

                success: false,
                message: "Token Missing"

            });

        }

        // Verify JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Admin Role Check
        if (!decoded.role || decoded.role !== "admin") {

            return res.status(403).json({

                success: false,
                message: "Access Denied. Admin Only."

            });

        }

        // Save Admin Data
        req.admin = decoded;

        next();

    } catch (err) {

        console.log("Admin Auth Error :", err.message);

        return res.status(401).json({

            success: false,
            message: "Invalid or Expired Token"

        });

    }

};

module.exports = adminAuth;