/* =====================================================
   LEADERBOARD FRONTEND
   ===================================================== */

(function () {

    "use strict";


    /* =================================================
       CONFIG
    ================================================= */

    const API =
        "/api/leaderboard";


    const TOKEN =
        localStorage.getItem("token");


    let currentPeriod = "today";

    let controller = null;


    /* =================================================
       PERIOD NAMES
    ================================================= */

    const PERIOD_NAMES = {

        today: "Today",

        yesterday: "Yesterday",

        thisweek: "This Week",

        lastweek: "Last Week",

        month: "Month"

    };


    /* =================================================
       LOGIN CHECK
    ================================================= */

   

    /* =================================================
       DOM READY
    ================================================= */

    document.addEventListener(
        "DOMContentLoaded",
        function () {

            setupButtons();

            setActiveButton(
                currentPeriod
            );

            loadLeaderboard(
                currentPeriod
            );

        }
    );


    /* =================================================
       SETUP BUTTONS
    ================================================= */

    function setupButtons() {

        const buttons =
            document.querySelectorAll(
                ".filter-btn[data-period]"
            );


        buttons.forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const period =
                            String(
                                button.dataset.period || ""
                            ).toLowerCase();


                        if (
                            !Object.prototype.hasOwnProperty.call(
                                PERIOD_NAMES,
                                period
                            )
                        ) {

                            console.error(
                                "Invalid leaderboard period:",
                                period
                            );

                            return;
                        }


                        if (
                            period === currentPeriod
                        ) {

                            return;
                        }


                        currentPeriod =
                            period;


                        setActiveButton(
                            currentPeriod
                        );


                        loadLeaderboard(
                            currentPeriod
                        );

                    }
                );

            }
        );


        const refreshButton =
            document.getElementById(
                "refreshBtn"
            );


        if (refreshButton) {

            refreshButton.addEventListener(
                "click",
                function () {

                    loadLeaderboard(
                        currentPeriod,
                        true
                    );

                }
            );

        }

    }


    /* =================================================
       ACTIVE BUTTON
    ================================================= */

    function setActiveButton(
        period
    ) {

        document
            .querySelectorAll(
                ".filter-btn[data-period]"
            )
            .forEach(
                function (button) {

                    button.classList.toggle(
                        "active",
                        button.dataset.period === period
                    );

                }
            );


        const periodElement =
            document.getElementById(
                "currentPeriod"
            );


        if (periodElement) {

            periodElement.textContent =
                PERIOD_NAMES[period] ||
                "Today";

        }

    }


    /* =================================================
       API URL
    ================================================= */

    function buildApiUrl(
        period
    ) {

        const safePeriod =
            Object.prototype.hasOwnProperty.call(
                PERIOD_NAMES,
                period
            )
                ? period
                : "today";


        /*
         * IMPORTANT:
         *
         * Always use query parameter.
         *
         * NEVER:
         *
         * /api/leaderboard/pre
         *
         * ONLY:
         *
         * /api/leaderboard?period=today
         */

        const url =
            new URL(API);


        url.searchParams.set(
            "period",
            safePeriod
        );


        /*
         * Cache breaker
         */

        url.searchParams.set(
            "_",
            Date.now().toString()
        );


        return url.toString();

    }


    /* =================================================
       LOAD LEADERBOARD
    ================================================= */

    async function loadLeaderboard(
        period,
        forceRefresh = false
    ) {

        currentPeriod =
            Object.prototype.hasOwnProperty.call(
                PERIOD_NAMES,
                period
            )
                ? period
                : "today";


        setActiveButton(
            currentPeriod
        );


        showLoading();


        /*
         * Cancel previous request
         */

        if (controller) {

            controller.abort();

        }


        controller =
            new AbortController();


        const url =
            buildApiUrl(
                currentPeriod
            );


        console.log(
            "LEADERBOARD REQUEST:",
            url
        );


        try {

            const headers = {

                "Accept":
                    "application/json"

            };


            /*
             * Send token if available.
             */

            if (TOKEN) {

                headers.Authorization =
                    "Bearer " + TOKEN;

            }


            const response =
                await fetch(
                    url,
                    {

                        method: "GET",

                        headers,

                        cache: "no-store",

                        signal:
                            controller.signal

                    }
                );


            console.log(
                "LEADERBOARD STATUS:",
                response.status
            );


            const contentType =
                response.headers.get(
                    "content-type"
                ) || "";


            /*
             * Server must return JSON.
             */

            if (
                !contentType.includes(
                    "application/json"
                )
            ) {

                const text =
                    await response.text();


                console.error(
                    "NON JSON RESPONSE:",
                    text
                );


                throw new Error(
                    "Server returned a non-JSON response."
                );

            }


            const data =
                await response.json();


            console.log(
                "LEADERBOARD DATA:",
                data
            );


            if (
                !response.ok
            ) {

                throw new Error(
                    data.message ||
                    "Leaderboard request failed"
                );

            }


            if (
                !data ||
                data.success !== true
            ) {

                throw new Error(
                    data?.message ||
                    "Invalid leaderboard response"
                );

            }


            renderLeaderboard(
                data
            );


        }
        catch (error) {

            /*
             * Abort is normal when user
             * quickly changes period.
             */

            if (
                error.name ===
                "AbortError"
            ) {

                return;
            }


            console.error(
                "LEADERBOARD ERROR:",
                error
            );


            showError(
                error.message ||
                "Unable to load leaderboard"
            );

        }

    }


    /* =================================================
       RENDER COMPLETE LEADERBOARD
    ================================================= */

    function renderLeaderboard(
        data
    ) {

        const leaderboard =
            Array.isArray(
                data.leaderboard
            )
                ? data.leaderboard
                : [];


        const top3 =
            Array.isArray(
                data.top3
            )
                ? data.top3
                : leaderboard.slice(
                    0,
                    3
                );


        /*
         * Render top 3
         */

        renderTopThree(
            top3
        );


        /*
         * Render current user
         */

        renderMyRank(
            data.myRank
        );


        /*
         * Render total players
         */

        const totalPlayers =
            document.getElementById(
                "totalPlayers"
            );


        if (totalPlayers) {

            const total =
                Number(
                    data.totalPlayers
                );


            totalPlayers.textContent =
                Number.isFinite(total)
                    ? total
                    : leaderboard.length;

        }


        /*
         * Render list
         */

        renderList(
            leaderboard,
            data.myRank
        );

    }


    /* =================================================
       TOP 3
    ================================================= */

    function renderTopThree(
        top3
    ) {

        const first =
            top3[0] || null;

        const second =
            top3[1] || null;

        const third =
            top3[2] || null;


        renderPodium(
            "first",
            first
        );


        renderPodium(
            "second",
            second
        );


        renderPodium(
            "third",
            third
        );

    }


    /* =================================================
       PODIUM ITEM
    ================================================= */

    function renderPodium(
        position,
        user
    ) {

        const mobile =
            document.getElementById(
                position + "Mobile"
            );


        const recharge =
            document.getElementById(
                position + "Recharge"
            );


        const reward =
            document.getElementById(
                position + "Reward"
            );


        if (!user) {

            if (mobile) {

                mobile.textContent =
                    "—";

            }


            if (recharge) {

                recharge.textContent =
                    "₹0";

            }


            if (reward) {

                reward.textContent =
                    "Reward ₹0";

            }


            return;
        }


        const userMobile =
            getUserMobile(
                user
            );


        const totalRecharge =
            getRecharge(
                user
            );


        const userReward =
            getReward(
                user
            );


        if (mobile) {

            mobile.textContent =
                userMobile;

        }


        if (recharge) {

            recharge.textContent =
                formatMoney(
                    totalRecharge
                );

        }


        if (reward) {

            reward.textContent =
                "Reward " +
                formatMoney(
                    userReward
                );

        }

    }


    /* =================================================
       MY RANK
    ================================================= */

    function renderMyRank(
        myRank
    ) {

        const data =
            myRank || {};


        const rank =
            data.rank;


        const mobile =
            data.mobile;


        const recharge =
            Number(
                data.recharge
            ) || 0;


        const reward =
            Number(
                data.reward
            ) || 0;


        const rankElement =
            document.getElementById(
                "myRank"
            );


        const mobileElement =
            document.getElementById(
                "myMobile"
            );


        const rechargeElement =
            document.getElementById(
                "myRecharge"
            );


        const rewardElement =
            document.getElementById(
                "myReward"
            );


        if (rankElement) {

            rankElement.textContent =
                rank &&
                rank !== "-"
                    ? "#" + rank
                    : "#-";

        }


        if (mobileElement) {

            mobileElement.textContent =
                mobile ||
                "Not Ranked";

        }


        if (rechargeElement) {

            rechargeElement.textContent =
                formatMoney(
                    recharge
                );

        }


        if (rewardElement) {

            rewardElement.textContent =
                formatMoney(
                    reward
                );

        }

    }


    /* =================================================
       LEADERBOARD LIST
    ================================================= */

    function renderList(
        leaderboard,
        myRank
    ) {

        const container =
            document.getElementById(
                "leaderList"
            );


        if (!container) {

            return;
        }


        if (
            !leaderboard.length
        ) {

            container.innerHTML = `

                <div class="leaderboard-empty">

                    <div>
                        No players found
                    </div>

                    <small>
                        No approved recharge found
                        for this period.
                    </small>

                </div>

            `;

            return;
        }


        const myRankNumber =
            Number(
                myRank?.rank
            ) || 0;


        container.innerHTML =
            leaderboard
                .map(
                    function (user) {

                        const rank =
                            Number(
                                user.leaderboardRank ??
                                user.rank
                            ) || 0;


                        const mobile =
                            getUserMobile(
                                user
                            );


                        const recharge =
                            getRecharge(
                                user
                            );


                        const reward =
                            getReward(
                                user
                            );


                        const isCurrentUser =
                            myRankNumber > 0 &&
                            rank ===
                            myRankNumber;


                        return `

                            <div
                                class="leader-row ${
                                    isCurrentUser
                                        ? "current-user"
                                        : ""
                                }"
                            >

                                <div class="rank-number">

                                    <span class="rank-badge">
                                        ${escapeHtml(
                                            String(rank)
                                        )}
                                    </span>

                                </div>


                                <div class="player-info">

                                    <div class="player-mobile">
                                        ${escapeHtml(
                                            mobile
                                        )}
                                    </div>

                                    <div class="player-label">
                                        Rank #${escapeHtml(
                                            String(rank)
                                        )}
                                    </div>

                                </div>


                                <div class="recharge-value">
                                    ${formatMoney(
                                        recharge
                                    )}
                                </div>


                                <div class="reward-value">
                                    ${formatMoney(
                                        reward
                                    )}
                                </div>

                            </div>

                        `;

                    }
                )
                .join("");

    }


    /* =================================================
       LOADING
    ================================================= */

    function showLoading() {

        const container =
            document.getElementById(
                "leaderList"
            );


        if (!container) {

            return;
        }


        container.innerHTML = `

            <div class="leaderboard-loading">

                Loading leaderboard...

            </div>

        `;

    }


    /* =================================================
       ERROR
    ================================================= */

    function showError(
        message
    ) {

        const container =
            document.getElementById(
                "leaderList"
            );


        if (!container) {

            return;
        }


        container.innerHTML = `

            <div class="leaderboard-error">

                <strong>
                    Leaderboard unavailable
                </strong>

                <span>
                    ${escapeHtml(
                        message
                    )}
                </span>

                <button
                    type="button"
                    id="retryLeaderboard"
                    class="filter-btn"
                >
                    Retry
                </button>

            </div>

        `;


        const retry =
            document.getElementById(
                "retryLeaderboard"
            );


        if (retry) {

            retry.addEventListener(
                "click",
                function () {

                    loadLeaderboard(
                        currentPeriod,
                        true
                    );

                }
            );

        }

    }


    /* =================================================
       GET MOBILE
    ================================================= */

    function getUserMobile(
        user
    ) {

        if (!user) {

            return "—";
        }


        const value =
            user.mobile ||
            user.user?.mobile ||
            user.phone ||
            user.user?.phone;


        if (!value) {

            return "—";
        }


        return String(
            value
        );

    }


    /* =================================================
       GET RECHARGE
    ================================================= */

    function getRecharge(
        user
    ) {

        if (!user) {

            return 0;
        }


        const value =
            user.totalRecharge ??
            user.recharge ??
            user.amount ??
            0;


        const number =
            Number(
                value
            );


        return Number.isFinite(
            number
        )
            ? number
            : 0;

    }


    /* =================================================
       GET REWARD
    ================================================= */

    function getReward(
        user
    ) {

        if (!user) {

            return 0;
        }


        const value =
            user.reward ??
            user.rewardAmount ??
            user.prize ??
            0;


        const number =
            Number(
                value
            );


        return Number.isFinite(
            number
        )
            ? number
            : 0;

    }


    /* =================================================
       MONEY FORMAT
    ================================================= */

    function formatMoney(
        value
    ) {

        const number =
            Number(
                value
            ) || 0;


        return "₹" +
            number.toLocaleString(
                "en-IN",
                {
                    maximumFractionDigits: 2
                }
            );

    }


    /* =================================================
       HTML ESCAPE
    ================================================= */

    function escapeHtml(
        value
    ) {

        return String(
            value ?? ""
        )
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );

    }


    /* =================================================
       PUBLIC FUNCTION
    ================================================= */

    window.loadLeaderboard =
        loadLeaderboard;


})();