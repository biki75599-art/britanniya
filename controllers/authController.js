const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ======================================================
// Generate Unique Invite Code
// ======================================================

function generateInviteCode() {
    return "BV" + Math.floor(100000 + Math.random() * 900000);
}

// ======================================================
// REGISTER
// POST /api/auth/register
// ======================================================

const register = async (req, res) => {
    try {
        console.log("REGISTER BODY:", req.body);

        const {
            name,
            mobile,
            password,
            confirmPassword,
            withdrawPin,
            referralCode
        } = req.body || {};

        // ==================================================
        // 1. Required Fields
        // ==================================================

        if (
            !name ||
            !mobile ||
            !password ||
            !confirmPassword ||
            !withdrawPin
        ) {
            return res.status(400).json({
                success: false,
                message: "All fields are required."
            });
        }

        // ==================================================
        // 2. Clean Input
        // ==================================================

        const cleanName = String(name).trim();
        const cleanMobile = String(mobile).trim();
        const cleanWithdrawPin = String(withdrawPin).trim();

        const cleanReferralCode = referralCode
            ? String(referralCode).trim().toUpperCase()
            : "";

        // ==================================================
        // 3. Mobile Validation
        // ==================================================

        if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
            return res.status(400).json({
                success: false,
                message: "Invalid mobile number."
            });
        }

        // ==================================================
        // 4. Password Match
        // ==================================================

        if (String(password) !== String(confirmPassword)) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match."
            });
        }

        // ==================================================
        // 5. Password Length
        // ==================================================

        if (String(password).length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters."
            });
        }

        // ==================================================
        // 6. Withdraw PIN Validation
        // ==================================================

        if (!/^\d{6,8}$/.test(cleanWithdrawPin)) {
            return res.status(400).json({
                success: false,
                message: "Withdraw PIN must be 6 to 8 digits."
            });
        }

        // ==================================================
        // 7. Check Existing Mobile
        // ==================================================

        const mobileExists = await User.findOne({
            mobile: cleanMobile
        });

        if (mobileExists) {
            return res.status(400).json({
                success: false,
                message: "Mobile already registered."
            });
        }

        // ==================================================
        // 8. FIRST USER / REFERRAL CHECK
        // ==================================================

        const totalUsers = await User.countDocuments();

        let parentUser = null;

        if (totalUsers > 0) {
            if (!cleanReferralCode) {
                return res.status(400).json({
                    success: false,
                    message: "Referral Code is required."
                });
            }

            parentUser = await User.findOne({
                inviteCode: cleanReferralCode
            });

            if (!parentUser) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid Referral Code."
                });
            }
        }

        // ==================================================
        // 9. Generate Unique Invite Code
        // ==================================================

        let newInviteCode;
        let inviteExists = true;

        while (inviteExists) {
            newInviteCode = generateInviteCode();

            inviteExists = await User.findOne({
                inviteCode: newInviteCode
            });
        }

        // ==================================================
        // 10. Hash Login Password
        // IMPORTANT:
        // bcryptjs sync method used for Cloudflare Worker
        // ==================================================

        const hashPassword = bcrypt.hashSync(
            String(password),
            10
        );

        // ==================================================
        // 11. Hash Withdraw PIN
        // ==================================================

        const hashWithdrawPin = bcrypt.hashSync(
            cleanWithdrawPin,
            10
        );

        // ==================================================
        // 12. Create User
        // ==================================================

        const user = new User({
            name: cleanName,
            mobile: cleanMobile,
            password: hashPassword,
            withdrawPin: hashWithdrawPin,
            inviteCode: newInviteCode,

            referredBy: parentUser
                ? parentUser.inviteCode
                : null,

            parent: parentUser
                ? parentUser._id
                : null
        });

        // ==================================================
        // 13. Save User
        // ==================================================

        await user.save();

        console.log(
            "NEW USER CREATED:",
            cleanMobile,
            "INVITE:",
            newInviteCode
        );

        // ==================================================
        // 14. Update Level 1 Parent
        // ==================================================

        if (parentUser) {
            parentUser.children =
                parentUser.children || [];

            parentUser.children.push(user._id);

            parentUser.level1Count =
                (parentUser.level1Count || 0) + 1;

            await parentUser.save();
        }

        // ==================================================
        // 15. Update Level 2 Parent
        // ==================================================

        if (
            parentUser &&
            parentUser.parent
        ) {
            const level2User =
                await User.findById(
                    parentUser.parent
                );

            if (level2User) {
                level2User.level2Count =
                    (level2User.level2Count || 0) + 1;

                await level2User.save();

                // ==================================================
                // 16. Update Level 3 Parent
                // ==================================================

                if (level2User.parent) {
                    const level3User =
                        await User.findById(
                            level2User.parent
                        );

                    if (level3User) {
                        level3User.level3Count =
                            (level3User.level3Count || 0) + 1;

                        await level3User.save();
                    }
                }
            }
        }

        // ==================================================
        // 17. Success
        // ==================================================

        return res.status(201).json({
            success: true,
            message: "Account Created Successfully.",

            user: {
                id: user._id,
                name: user.name,
                mobile: user.mobile,
                inviteCode: user.inviteCode,
                referredBy: user.referredBy
            }
        });

    } catch (err) {
        console.error(
            "REGISTER ERROR:",
            err?.stack || err
        );

        return res.status(500).json({
            success: false,
            message: "Server Error."
        });
    }
};

// ======================================================
// LOGIN
// POST /api/auth/login
// ======================================================

const login = async (req, res) => {
    try {
        console.log("LOGIN BODY:", req.body);

        const {
            mobile,
            password
        } = req.body || {};

        // ==================================================
        // 1. Required Fields
        // ==================================================

        if (!mobile || !password) {
            return res.status(400).json({
                success: false,
                message: "Mobile and Password are required."
            });
        }

        // ==================================================
        // 2. Clean Mobile
        // ==================================================

        const cleanMobile =
            String(mobile).trim();

        // ==================================================
        // 3. Find User
        // ==================================================

        const user =
            await User.findOne({
                mobile: cleanMobile
            });

        console.log(
            "LOGIN USER FOUND:",
            user
                ? user.mobile
                : "NO USER"
        );

        // ==================================================
        // 4. User Not Found
        // ==================================================

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User not found."
            });
        }

        // ==================================================
        // 5. Check Password
        // IMPORTANT:
        // bcrypt.compare() replaced with compareSync()
        // to prevent Cloudflare Worker hanging.
        // ==================================================

        console.log(
            "LOGIN: CHECKING PASSWORD"
        );

        const isMatch =
            bcrypt.compareSync(
                String(password),
                String(user.password || "")
            );

        console.log(
            "LOGIN: PASSWORD RESULT:",
            isMatch
        );

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Wrong Password."
            });
        }

        // ==================================================
        // 6. Check Blocked Account
        // ==================================================

        if (user.isBlocked) {
            return res.status(403).json({
                success: false,
                message: "Your Account Has Been Blocked"
            });
        }

        // ==================================================
        // 7. JWT Secret Check
        // ==================================================

        if (!process.env.JWT_SECRET) {
            console.error(
                "JWT_SECRET is missing."
            );

            return res.status(500).json({
                success: false,
                message: "JWT configuration missing."
            });
        }

        // ==================================================
        // 8. Generate JWT
        // ==================================================

        console.log(
            "LOGIN: GENERATING JWT"
        );

        const token =
            jwt.sign(
                {
                    id: user._id
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: "7d"
                }
            );

        console.log(
            "LOGIN: JWT GENERATED"
        );

        // ==================================================
        // 9. Login Success
        // ==================================================

        return res.status(200).json({
            success: true,
            message: "Login Successful",

            token,

            user: {
                id: user._id,
                name: user.name,
                mobile: user.mobile,
                inviteCode: user.inviteCode
            }
        });

    } catch (err) {
        console.error(
            "LOGIN ERROR:",
            err?.stack || err
        );

        return res.status(500).json({
            success: false,
            message: "Server Error."
        });
    }
};

// ======================================================
// RESET LOGIN PASSWORD
// POST /api/auth/reset-login-password
// ======================================================

const resetLoginPassword = async (req, res) => {
    try {
        const {
            mobile,
            currentPassword,
            newPassword
        } = req.body || {};

        if (
            !mobile ||
            !currentPassword ||
            !newPassword
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Mobile, current password and new password are required."
            });
        }

        const cleanMobile =
            String(mobile).trim();

        if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
            return res.status(400).json({
                success: false,
                message: "Invalid mobile number."
            });
        }

        if (String(newPassword).length < 6) {
            return res.status(400).json({
                success: false,
                message:
                    "New password must be at least 6 characters."
            });
        }

        const user =
            await User.findOne({
                mobile: cleanMobile
            });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        // Cloudflare-safe sync bcrypt
        const passwordMatch =
            bcrypt.compareSync(
                String(currentPassword),
                String(user.password || "")
            );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message:
                    "Current login password is incorrect."
            });
        }

        // Cloudflare-safe sync bcrypt
        const newPasswordHash =
            bcrypt.hashSync(
                String(newPassword),
                10
            );

        user.password =
            newPasswordHash;

        await user.save();

        return res.status(200).json({
            success: true,
            message:
                "Login password changed successfully."
        });

    } catch (error) {
        console.error(
            "RESET LOGIN PASSWORD ERROR:",
            error?.stack || error
        );

        return res.status(500).json({
            success: false,
            message: "Server error."
        });
    }
};

// ======================================================
// RESET WITHDRAW PASSWORD
// POST /api/auth/reset-withdraw-password
// ======================================================

const resetWithdrawPassword = async (req, res) => {
    try {
        const {
            mobile,
            currentWithdrawPassword,
            newWithdrawPassword
        } = req.body || {};

        if (
            !mobile ||
            !currentWithdrawPassword ||
            !newWithdrawPassword
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Mobile, current withdraw password and new withdraw password are required."
            });
        }

        const cleanMobile =
            String(mobile).trim();

        const currentPin =
            String(currentWithdrawPassword).trim();

        const newPin =
            String(newWithdrawPassword).trim();

        // ==================================================
        // Mobile Validation
        // ==================================================

        if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
            return res.status(400).json({
                success: false,
                message: "Invalid mobile number."
            });
        }

        // ==================================================
        // New Withdraw Password Validation
        // ==================================================

        if (!/^\d{6,8}$/.test(newPin)) {
            return res.status(400).json({
                success: false,
                message:
                    "Withdraw password must be 6 to 8 digits."
            });
        }

        // ==================================================
        // Find User
        // ==================================================

        const user =
            await User.findOne({
                mobile: cleanMobile
            });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        // ==================================================
        // Check Existing Withdraw Password
        // ==================================================

        if (!user.withdrawPin) {
            return res.status(400).json({
                success: false,
                message:
                    "Withdraw password has not been created yet."
            });
        }

        // Cloudflare-safe sync bcrypt
        const pinMatch =
            bcrypt.compareSync(
                currentPin,
                String(user.withdrawPin)
            );

        if (!pinMatch) {
            return res.status(401).json({
                success: false,
                message:
                    "Current withdraw password is incorrect."
            });
        }

        // Cloudflare-safe sync bcrypt
        const newPinHash =
            bcrypt.hashSync(
                newPin,
                10
            );

        user.withdrawPin =
            newPinHash;

        await user.save();

        return res.status(200).json({
            success: true,
            message:
                "Withdraw password changed successfully."
        });

    } catch (error) {
        console.error(
            "RESET WITHDRAW PASSWORD ERROR:",
            error?.stack || error
        );

        return res.status(500).json({
            success: false,
            message: "Server error."
        });
    }
};

// ======================================================
// EXPORT
// ======================================================

module.exports = {
    register,
    login,
    resetLoginPassword,
    resetWithdrawPassword
};