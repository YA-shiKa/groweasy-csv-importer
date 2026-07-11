import "dotenv/config";
import express from "express";
import cors from "cors";
import { importRouter } from "./src/routes/importRoutes.js";
import { errorHandler, notFoundHandler } from "./src/middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 8080;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

app.use(cors({ origin: FRONTEND_ORIGIN }));
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api", importRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`GrowEasy CSV Importer backend listening on port ${PORT}`);
});
