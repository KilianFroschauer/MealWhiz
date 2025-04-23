import express from "express";
import { setupSwagger } from "./swagger";
import { recipeRouter } from "./recipe-router";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use("/recipes", recipeRouter);

setupSwagger(app);

app.get("/", (request, response) => {
    response.send("Mealwhiz api!")
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});