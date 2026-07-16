import express from "express";
import cors from "cors";
import { errorMiddleware } from "./middleware/error.middleware.js";
import healthRoutes from "./routes/health.route.js";
import routes from "./routes/index.js";


const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/v1/health", healthRoutes);
app.use("/api/v1", routes);

app.use(errorMiddleware);

export default app;