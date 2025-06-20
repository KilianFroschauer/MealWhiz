import express, { Request, Response } from "express";
import cors from "cors";
import { setupSwagger } from "./config/swagger.config";
import mainRouter from "./routes/index.routes";

const app = express();

// Parse allowed origins from environment variable or use '*' to allow all
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : ['*'];

if (allowedOrigins.includes('*')) {
    app.use(
        cors({
            origin: '*',
            methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            allowedHeaders: ["Content-Type", "Authorization"],
        })
    );
} else {
    // Selective origin allowance
    app.use(
        cors({
            origin: function (origin, callback) {
                // Allow requests with no origin (like mobile apps or curl requests)
                if (!origin || allowedOrigins.indexOf(origin) !== -1) {
                    callback(null, true);
                } else {
                    callback(new Error("Not allowed by CORS"));
                }
            },
            methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            allowedHeaders: ["Content-Type", "Authorization"],
            credentials: true
        })
    );
}

app.use(express.json());

app.use("/", mainRouter);

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
