import { httpServerHandler } from "cloudflare:node";

const PORT = 3000;

let handlerPromise = null;

function setCloudflareEnv(env) {
  for (const [key, value] of Object.entries(env || {})) {
    if (typeof value === "string") {
      process.env[key] = value;
    }
  }
}

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

async function getAppHandler(env) {
  setCloudflareEnv(env);

  if (!handlerPromise) {
    handlerPromise = import("./server.js").then(({ app }) => {
      app.listen(PORT);
      return httpServerHandler({ port: PORT });
    });
  }

  return handlerPromise;
}

export default {
  async fetch(request, env) {
    setCloudflareEnv(env);

    const url = new URL(request.url);

    if (
      url.pathname === "/income/pages/login/reset/" ||
      url.pathname === "/register"
    ) {
      const assetUrl = new URL("/register.html", request.url);

      return env.ASSETS.fetch(
        new Request(assetUrl, request)
      );
    }

    if (env.ASSETS && isStaticAssetPath(url.pathname)) {
      const assetResponse = await env.ASSETS.fetch(request);

      if (assetResponse.status !== 404) {
        return assetResponse;
      }
    }

    const handler = await getAppHandler(env);

    return handler(request);
  },

  async scheduled(controller, env) {
    setCloudflareEnv(env);

    try {
      const connectDBModule = await import("./config/db.js");
      const connectDB =
        connectDBModule.default || connectDBModule;

      await connectDB();

      const incomeService =
        await import("./services/productIncomeService.js");

      if (
        typeof incomeService.creditProductIncome === "function"
      ) {
        await incomeService.creditProductIncome();
      }

      if (controller.cron === "30 18 * * *") {
        const resetService =
          await import("./services/resetTodayIncomeService.js");

        if (
          typeof resetService.resetTodayIncome === "function"
        ) {
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