import { httpServerHandler } from "cloudflare:node";

// Express runs on Cloudflare Workers' Node.js compatibility runtime.
// Static files are served from Workers Assets; API and dynamic routes go to Express.
const PORT = 3000;

const { app } = await import("./server.js");

// Cloudflare's official Express integration uses app.listen() + httpServerHandler().
app.listen(PORT);

function isStaticAssetPath(pathname) {
  return (
    pathname.startsWith("/css/") ||
    pathname.startsWith("/js/") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/uploads/") ||
    pathname.endsWith(".html") ||
    pathname.endsWith(".css") ||
    pathname.endsWith(".js") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".jpeg") ||
    pathname.endsWith(".webp") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".ico")
  );
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Expose Worker secrets/env vars to the existing CommonJS app before it is used.
    for (const [key, value] of Object.entries(env || {})) {
      if (typeof value === "string") process.env[key] = value;
    }

    // Deep registration URL: /income/pages/login/reset/?inviteCode=...
    // The page itself is a static asset; the query string is preserved for the browser JS.
    if (url.pathname === "/income/pages/login/reset/" || url.pathname === "/register") {
      const assetUrl = new URL("/register.html", request.url);
      return env.ASSETS.fetch(new Request(assetUrl, request));
    }

    // Serve frontend/static files directly from Workers Assets.
    if (env.ASSETS && isStaticAssetPath(url.pathname)) {
      const assetResponse = await env.ASSETS.fetch(request);
      if (assetResponse.status !== 404) return assetResponse;
    }

    // API + dynamic Express routes.
    return httpServerHandler({ port: PORT })(request);
  },

  async scheduled(controller, env) {
    // Keep the existing cron services. Environment values are exposed first.
    for (const [key, value] of Object.entries(env || {})) {
      if (typeof value === "string") process.env[key] = value;
    }

    try {
      const connectDBModule = await import("./config/db.js");
      const connectDB = connectDBModule.default || connectDBModule;
      await connectDB();

      const incomeService = await import("./services/productIncomeService.js");
      if (typeof incomeService.creditProductIncome === "function") {
        await incomeService.creditProductIncome();
      }

      if (controller.cron === "30 18 * * *") {
        const resetService = await import("./services/resetTodayIncomeService.js");
        if (typeof resetService.resetTodayIncome === "function") {
          await resetService.resetTodayIncome();
        }
      }

      console.log("CRON COMPLETED:", controller.cron);
    } catch (error) {
      console.error("CRON FAILED:", error?.stack || error);
    }
  }
};
