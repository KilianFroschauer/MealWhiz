import express from "express";
import { setupSwagger } from "./swagger";
import { recipeRouter } from "./recipe-router";
import pool from "./database";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use("/recipes", recipeRouter);

setupSwagger(app);

async function test() {
    console.log("Test function called!");
    const abc = await pool.query("SELECT * FROM food_products LIMIT 10");

    console.log(abc.rows);
}

test()


app.get("/", (request, response) => {
    response.send("Mealwhiz api!")
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});