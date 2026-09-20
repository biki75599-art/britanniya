const Recharge = require("../models/Recharge");
const User = require("../models/User");

// =====================================================
// CONFIG
// =====================================================

const ALLOWED_PERIODS = [
    "today",
    "yesterday",
    "thisweek",
    "lastweek",
    "month"
];


// =====================================================
// DATE HELPERS
// =====================================================

function startOfDay(date) {
    const d = new Date(date);

    d.setHours(
        0,
        0,
        0,
        0
    );

    return d;
}


function endOfDay(date) {
    const d = new Date(date);

    d.setHours(
        23,
        59,
        59,
        999
    );

    return d;
}


// =====================================================
// PERIOD DATES
// =====================================================

function getPeriodDates(period) {

    const now = new Date();

    let startDate;
    let endDate;


    // =================================================
    // TODAY
    // =================================================

    if (period === "today") {

        startDate =
            startOfDay(now);

        endDate =
            endOfDay(now);
    }


    // =================================================
    // YESTERDAY
    // =================================================

    else if (period === "yesterday") {

        const yesterday =
            new Date(now);

        yesterday.setDate(
            yesterday.getDate() - 1
        );

        startDate =
            startOfDay(yesterday);

        endDate =
            endOfDay(yesterday);
    }


    // =================================================
    // THIS WEEK
    // Sunday -> Today
    // =================================================

    else if (period === "thisweek") {

        startDate =
            new Date(now);

        startDate.setDate(
            startDate.getDate() -
            startDate.getDay()
        );

        startDate =
            startOfDay(startDate);

        endDate =
            endOfDay(now);
    }


    // =================================================
    // LAST WEEK
    // Sunday -> Saturday
    // =================================================

    else if (period === "lastweek") {

        startDate =
            new Date(now);

        startDate.setDate(
            startDate.getDate() -
            startDate.getDay() -
            7
        );

        startDate =
            startOfDay(startDate);


        endDate =
            new Date(now);

        endDate.setDate(
            endDate.getDate() -
            endDate.getDay() -
            1
        );

        endDate =
            endOfDay(endDate);
    }


    // =================================================
    // THIS MONTH
    // =================================================

    else if (period === "month") {

        startDate =
            new Date(
                now.getFullYear(),
                now.getMonth(),
                1,
                0,
                0,
                0,
                0
            );

        endDate =
            endOfDay(now);
    }


    // =================================================
    // DEFAULT = TODAY
    // =================================================

    else {

        startDate =
            startOfDay(now);

        endDate =
            endOfDay(now);
    }


    return {
        startDate,
        endDate
    };
}


// =====================================================
// RANK REWARD
// =====================================================

function getRankReward(rank) {

    switch (Number(rank)) {

        case 1:
            return 2000;

        case 2:
            return 1500;

        case 3:
            return 1000;

        case 4:
            return 600;

        case 5:
            return 500;

        default:
            return 0;
    }
}


// =====================================================
// MASK MOBILE
// =====================================================

function maskMobile(mobile) {

    const value =
        String(mobile || "");

    if (!value) {
        return "------";
    }

    if (value.length <= 6) {
        return value;
    }

    return (
        value.substring(0, 6) +
        "****"
    );
}


// =====================================================
// FORMAT USER
// =====================================================

function formatUser(
    item,
    rank
) {

    const mobile =
        item.user?.mobile ||
        item.mobile ||
        "------";

    const recharge =
        Number(
            item.totalRecharge
        ) || 0;

    return {

        rank,

        mobile:
            maskMobile(mobile),

        recharge,

        reward:
            getRankReward(rank)

    };
}


// =====================================================
// GET LEADERBOARD DATA
// =====================================================

async function getLeaderboardData(
    startDate,
    endDate
) {

    const data =
        await Recharge.aggregate([

            // -----------------------------------------
            // ONLY APPROVED RECHARGES
            // -----------------------------------------

            {
                $match: {

                    status: "Approved",

                    createdAt: {
                        $gte: startDate,
                        $lte: endDate
                    }

                }
            },


            // -----------------------------------------
            // GROUP BY USER
            // -----------------------------------------

            {
                $group: {

                    _id: "$user",

                    totalRecharge: {

                        $sum: {

                            $convert: {

                                input: "$amount",

                                to: "double",

                                onError: 0,

                                onNull: 0

                            }

                        }

                    }

                }
            },


            // -----------------------------------------
            // ONLY POSITIVE RECHARGE
            // -----------------------------------------

            {
                $match: {

                    totalRecharge: {
                        $gt: 0
                    }

                }
            },


            // -----------------------------------------
            // USER DATA
            // -----------------------------------------

            {
                $lookup: {

                    from: "users",

                    localField: "_id",

                    foreignField: "_id",

                    as: "user"

                }
            },


            // -----------------------------------------
            // USER REQUIRED
            // -----------------------------------------

            {
                $unwind: {

                    path: "$user",

                    preserveNullAndEmptyArrays: false

                }

            },


            // -----------------------------------------
            // HIGHEST RECHARGE FIRST
            // -----------------------------------------

            {
                $sort: {

                    totalRecharge: -1

                }

            }

        ]);


    return data;
}


// =====================================================
// BUILD RANKING
// =====================================================
//
// IMPORTANT:
//
// Rank is based ONLY on actual recharge amount.
//
// Highest recharge = #1
// Second highest   = #2
// Third highest    = #3
//
// No artificial ₹70,000 / ₹50,000 threshold.
// =====================================================

function buildRanking(users) {

    const allUsers =
        Array.isArray(users)
            ? users
                .filter(
                    user =>
                        Number(
                            user.totalRecharge
                        ) > 0
                )
                .sort(
                    (a, b) => {

                        const rechargeA =
                            Number(
                                a.totalRecharge
                            ) || 0;

                        const rechargeB =
                            Number(
                                b.totalRecharge
                            ) || 0;


                        // Highest recharge first
                        if (
                            rechargeB !==
                            rechargeA
                        ) {

                            return (
                                rechargeB -
                                rechargeA
                            );

                        }


                        // Stable tie breaker
                        return String(
                            a._id
                        ).localeCompare(
                            String(
                                b._id
                            )
                        );

                    }
                )
            : [];


    return allUsers.map(
        (user, index) => ({

            ...user,

            leaderboardRank:
                index + 1

        })
    );
}


// =====================================================
// GET CURRENT USER ID
// =====================================================

function getLoggedUserId(req) {

    return (
        req.user?._id ||
        req.user?.id ||
        req.user?.userId ||
        null
    );
}


// =====================================================
// FIND CURRENT USER IN RANKING
// =====================================================

function findCurrentUser(
    rankedUsers,
    loggedUserId
) {

    if (
        !loggedUserId
    ) {

        return null;
    }


    const targetId =
        String(
            loggedUserId
        );


    return (
        rankedUsers.find(
            user =>
                String(
                    user._id
                ) === targetId
        ) ||
        null
    );
}


// =====================================================
// GET USER PROFILE FALLBACK
// =====================================================

async function getUserProfile(
    loggedUserId
) {

    if (!loggedUserId) {
        return null;
    }


    const id =
        String(
            loggedUserId
        );


    // Mongo ObjectId validation
    if (
        !/^[a-fA-F0-9]{24}$/.test(
            id
        )
    ) {

        return null;
    }


    try {

        return await User
            .findById(id)
            .select(
                "_id mobile"
            )
            .lean();

    } catch (error) {

        console.error(
            "GET USER PROFILE ERROR:",
            error
        );

        return null;
    }
}


// =====================================================
// LEADERBOARD API
// =====================================================

exports.getLeaderboard =
async function (
    req,
    res
) {

    try {

        // ---------------------------------------------
        // PERIOD
        // ---------------------------------------------

        const period =
            String(
                req.params.period ||
                req.query.period ||
                "today"
            ).toLowerCase();


        // ---------------------------------------------
        // VALIDATE PERIOD
        // ---------------------------------------------

        if (
            !ALLOWED_PERIODS.includes(
                period
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid leaderboard period"

            });

        }


        // ---------------------------------------------
        // GET DATE RANGE
        // ---------------------------------------------

        const {
            startDate,
            endDate
        } =
            getPeriodDates(
                period
            );


        // ---------------------------------------------
        // DATABASE
        // ---------------------------------------------

        const periodUsers =
            await getLeaderboardData(
                startDate,
                endDate
            );


        // ---------------------------------------------
        // BUILD RANKING
        // ---------------------------------------------

        const rankedUsers =
            buildRanking(
                periodUsers
            );


        // ---------------------------------------------
        // FORMAT LEADERBOARD
        // ---------------------------------------------

        const leaderboard =
            rankedUsers.map(
                item =>
                    formatUser(
                        item,
                        item.leaderboardRank
                    )
            );


        // ---------------------------------------------
        // TOP 3
        // ---------------------------------------------

        const top3 =
            leaderboard.slice(
                0,
                3
            );


        // ---------------------------------------------
        // DEFAULT MY RANK
        // ---------------------------------------------

 // =====================================================
// CURRENT USER RANK
// =====================================================

let myRank = {
    rank: "-",
    mobile: "Not Ranked",
    recharge: 0,
    reward: 0
};

const authUser = req.user || {};

const loggedUserId =
    authUser._id ||
    authUser.id ||
    authUser.userId ||
    authUser.user_id;

const loggedMobile =
    authUser.mobile ||
    authUser.phone ||
    authUser.mobileNumber;


// -----------------------------------------------------
// FIND CURRENT USER
// -----------------------------------------------------

let currentUser = null;


// 1. Match by MongoDB User ID
if (loggedUserId) {

    currentUser = rankedUsers.find(function (user) {

        return String(user._id) ===
            String(loggedUserId);

    });

}


// 2. If ID didn't match, match by mobile
if (!currentUser && loggedMobile) {

    const cleanAuthMobile =
        String(loggedMobile).replace(/\D/g, "");

    currentUser = rankedUsers.find(function (user) {

        const userMobile =
            user.user?.mobile ||
            user.mobile ||
            user.phone ||
            "";

        const cleanUserMobile =
            String(userMobile).replace(/\D/g, "");

        return (
            cleanUserMobile &&
            cleanUserMobile === cleanAuthMobile
        );

    });

}


// -----------------------------------------------------
// USER FOUND
// -----------------------------------------------------

if (currentUser) {

    const rank =
        Number(currentUser.leaderboardRank) || 0;

    const recharge =
        Number(currentUser.totalRecharge) || 0;

    const mobile =
        currentUser.user?.mobile ||
        currentUser.mobile ||
        currentUser.phone ||
        loggedMobile ||
        "";

    myRank = {

        rank: rank || "-",

        mobile:
            mobile
                ? maskMobile(mobile)
                : "User",

        recharge,

        reward:
            getRankReward(rank)

    };

}


// -----------------------------------------------------
// USER NOT FOUND
// -----------------------------------------------------

else {

    // User may not have any approved recharge
    // during selected leaderboard period.

    let profile = null;

    if (loggedUserId) {

        try {

            profile =
                await User.findById(
                    loggedUserId
                )
                .select("mobile")
                .lean();

        } catch (e) {

            profile = null;

        }

    }


    if (!profile && loggedMobile) {

        try {

            profile =
                await User.findOne({
                    mobile: loggedMobile
                })
                .select("mobile")
                .lean();

        } catch (e) {

            profile = null;

        }

    }


    if (profile) {

        myRank.mobile =
            maskMobile(
                profile.mobile
            );

    }

}

        // ---------------------------------------------
        // RESPONSE
        // ---------------------------------------------

        return res.status(200).json({

            success: true,

            period,

            startDate,

            endDate,

            leaderboard,

            top3,

            myRank,

            totalPlayers:
                leaderboard.length

        });

    }


    // =================================================
    // ERROR
    // =================================================

    catch (error) {

        console.error(
            "LEADERBOARD ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Leaderboard server error"

        });

    }

};