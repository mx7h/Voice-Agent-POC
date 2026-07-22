import express from "express";
import cors from "cors";
import { errorMiddleware } from "./middleware/error.middleware.js";
import healthRoutes from "./routes/health.route.js";
import routes from "./routes/index.js";


const app = express();

// Middlewares
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

app.use(
  cors({
    origin: clientUrl,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/v1/health", healthRoutes);
app.use("/api/v1", routes);

app.use(errorMiddleware);

export default app;