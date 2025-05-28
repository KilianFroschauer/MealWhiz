import express, { Request, Response } from "express";
import cors from "cors";
import { setupSwagger } from "./config/swagger.config";
import { recipeRouter } from "./routes/recipe.routes";
import { eventRouter } from "./routes/event.routes";
import { authRouter } from "./routes/auth.routes";
import cartRouter from "./routes/cart.routes";

const app = express();

const allowedOrigins = [
    'http://127.0.0.1:5500', // Common for VS Code Live Server
    'http://localhost:5500',  // Another common Live Server port
    // Add any other origins your frontend might be served from
];

app.use(
    cors({
        origin: function (origin, callback) {
            // Allow requests with no origin (like mobile apps or curl requests)
            // or if the origin is in the allowedOrigins list.
            if (!origin || allowedOrigins.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true, // This is crucial for allowing cookies/session data
    })
);
app.use(express.json());

app.use("/recipes", recipeRouter);
app.use("/events", eventRouter);
app.use("/", authRouter);
app.use("/cart", cartRouter);

// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date() });
});

// Swagger documentation
setupSwagger(app);

// TODO: Add authentication middleware
// TODO: Add error handling middleware

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({ error: "Not Found" });
});

export default app;