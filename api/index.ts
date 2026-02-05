import { app, setupServer } from "../server/index.js";

// Initialize the server logic
// We use a promise to ensure it only runs once
const setupPromise = setupServer();

export default async function handler(req: any, res: any) {
    console.log("[DEBUG] Vercel handler started. Setup promise status pending...");
    try {
        await setupPromise;
        console.log("[DEBUG] Setup promise resolved. Handing off to app.");
        app(req, res);
    } catch (e) {
        console.error("[DEBUG] Setup failed:", e);
        res.status(500).json({ error: "Server setup failed", details: String(e) });
    }
}
