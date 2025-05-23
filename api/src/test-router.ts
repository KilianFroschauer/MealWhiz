import express from "express";

const testRouter = express.Router();

testRouter.get("/", (req, res) => {
    res.send("Cart works");
});

export default testRouter;
