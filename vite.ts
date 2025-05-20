import express, { Express } from "express";
import type { Server } from "http";
import { createServer as createViteServer } from "vite";
import path from "path";

export function log(message: string, source = "express") {
  console.log(`${new Date().toLocaleTimeString()} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const vite = await createViteServer({
    root: path.join(import.meta.dirname, "../client"),
    server: {
      hmr: {
        server: server,
      },
      middlewareMode: true,
    },
    appType: "spa",
  });

  app.use(vite.middlewares);

  app.use("*", async (req, res, next) => {
    try {
      const url = req.originalUrl;

      // Skip API routes
      if (url.startsWith("/api")) {
        return next();
      }

      // always read the template from disk to get SSR changes
      // in a non-development environment we would probably cache this
      // and avoid doing this on every request
      let template = await vite.transformIndexHtml(
        url,
        `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
    <title>BankSecure - Modern Banking Platform</title>
    <meta name="description" content="BankSecure is your secure online banking solution with account management, transaction tracking, and financial tools in one place." />
    <!-- Open Graph Tags -->
    <meta property="og:title" content="BankSecure - Modern Banking Platform" />
    <meta property="og:description" content="Manage your finances securely with our online banking platform. Track transactions, manage accounts, and plan your budget." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://banksecure.com" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
    <!-- This is a replit script which adds a banner on the top of the page when opened in development mode outside the replit environment -->
    <script type="text/javascript" src="https://replit.com/public/js/replit-dev-banner.js"></script>
  </body>
</html>`,
      );

      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e) {
      const error = e as Error;
      vite.ssrFixStacktrace(error);
      next(error);
    }
  });
}

export function serveStatic(app: Express) {
  app.use("/", express.static(path.join(import.meta.dirname, "../dist/public")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(import.meta.dirname, "../dist/public/index.html"));
  });
        }
