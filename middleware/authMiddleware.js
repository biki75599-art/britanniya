const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {

    try {

        const authHeader =
            req.headers.authorization || "";


        const parts =
            authHeader.trim().split(/\s+/);


        const scheme =
            parts[0];


        const token =
            parts[1];


        if (
            scheme !== "Bearer" ||
            !token
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Access Denied: Bearer token required"
            });
        }


        const secret =
            process.env.JWT_SECRET;


        if (!secret) {

            console.error(
                "JWT_SECRET is missing"
            );

            return res.status(500).json({

                success: false,

                message:
                    "Server authentication configuration error"
            });
        }


        const decoded =
            jwt.verify(
                token,
                secret
            );


        req.user = decoded;


        next();


    } catch (error) {

        console.error(
            "AUTH ERROR:",
            error.message
        );


        return res.status(401).json({

            success: false,

            message:
                "Invalid Token"
        });
    }
}


module.exports = authMiddleware;