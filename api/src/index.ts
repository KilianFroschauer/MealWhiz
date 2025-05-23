import express, { Request, Response } from "express";
import cors from "cors";
import { setupSwagger } from "./config/swagger.config";
import { recipeRouter } from "./recipe-router";
import { eventRouter } from "./event-router";
import router from "./auth/auth-router";
import session from "express-session";
import cartRouter from "./cart-router";
import testRouter from "./test-router";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);
app.use(express.json());

app.use(
    session({
        secret: "mealonaut",
        resave: false,
        saveUninitialized: false,
    })
);

app.use("/recipes", recipeRouter);
app.use("/events", eventRouter);
app.use("/", router);
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

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});
