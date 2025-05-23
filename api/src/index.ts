import express from "express";
import cors from 'cors';
import { setupSwagger } from "./swagger";
import { recipeRouter } from "./recipe-router";
import { eventRouter } from "./event-router";
import router from "./auth/auth-router";
import session from "express-session";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.use(session({
    secret: 'your secret key', // Replace with a strong secret
    resave: false,
    saveUninitialized: false, // Set to true if you want to save sessions that are new but not modified
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        httpOnly: true, // Prevents client-side JS from accessing the cookie
        maxAge: 1000 * 60 * 60 * 24 // Optional: e.g., 1 day
    }
}));

app.use("/recipes", recipeRouter);
app.use("/events", eventRouter);
app.use('/', router);

setupSwagger(app);

app.get("/", (request, response) => {
    response.send("Mealwhiz api!")
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});
