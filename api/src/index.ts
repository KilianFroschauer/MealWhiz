import express from "express";
import { recipeRouter } from "./recipe-router";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use("/recipes", recipeRouter);

app.get("/", (request, response) => {
    response.send("Mealwhiz api!")
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });