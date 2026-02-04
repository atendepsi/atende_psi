import { app, setupServer } from "../server/index.js";

// Initialize the server logic
// We use a promise to ensure it only runs once
const setupPromise = setupServer();

export default async function handler(req: any, res: any) {
    await setupPromise;
    app(req, res);
}
