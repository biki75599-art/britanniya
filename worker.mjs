import { handleAsNodeRequest } from "cloudflare:node";

const SERVER_PORT = 8787;
let serverPromise = null;

async function ensureServer() {
    if (!serverPromise) {
        serverPromise = (async () => {
            console.log("Initializing Express server...");
            const m = await import("./server.js");
            const app = m.app || m.default?.app;

            if (!app || typeof app.listen !== "function") {
                throw new Error("Express app could not be loaded");
            }

            app.listen(SERVER_PORT);
            console.log(`Node HTTP server listening on port ${SERVER_PORT}`);
        })().catch((error) => {
            serverPromise = null;
            throw error;
        });
    }

    return serverPromise;
}

async function loadEnvironment(env) {
    for (const [key, value] of Object.entries(env || {})) {
        if (typeof value === "string") {
            process.env[key] = value;
        }
    }
}

function jsonResponse(payload, status = 200) {
    return new Response(JSON.stringify(payload), {
        status,
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store"
        }
    });
}

export default {
    async fetch(request, env) {
        try {
            const url = new URL(request.url);

            await loadEnvironment(env);

            console.log("REQUEST:", request.method, url.pathname);

            if (request.method === "GET" && url.pathname === "/health") {
                return jsonResponse({
                    success: true,
                    status: "healthy"
                });
            }

            if (!url.pathname.startsWith("/api/") && env.ASSETS) {
                const assetResponse = await env.ASSETS.fetch(request);

                if (assetResponse.status !== 404) {
                    return assetResponse;
                }
            }

            await ensureServer();

            return await handleAsNodeRequest(
                SERVER_PORT,
                request
            );
        } catch (error) {
            console.error(
                "WORKER ERROR:",
                error?.stack || error
            );

            return jsonResponse({
                success: false,
                message: "Internal server error"
            }, 500);
        }
    },

    async scheduled(controller, env) {
        try {
            await loadEnvironment(env);

            const connectDBModule = await import("./config/db.js");
            const connectDB =
                connectDBModule.default || connectDBModule;

            await connectDB();

            const incomeService =
                await import("./services/productIncomeService.js");

            if (typeof incomeService.creditProductIncome === "function") {
                await incomeService.creditProductIncome();
            }

            // 30 18 UTC = 00:00 IST. Reset daily counters once per day.
            if (controller.cron === "30 18 * * *") {
                const resetService =
                    await import("./services/resetTodayIncomeService.js");

                if (typeof resetService.resetTodayIncome === "function") {
                    await resetService.resetTodayIncome();
                }
            }

            console.log("CRON COMPLETED:", controller.cron);
        } catch (error) {
            console.error(
                "CRON FAILED:",
                error?.stack || error
            );
        }
    }
};
