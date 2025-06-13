import dotenv from "dotenv";

dotenv.config(); // Load environment variables first

import app from "./app";

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        app.listen(PORT, () => {
            // Changed: server.listen to app.listen
            console.log(`🚀 Server is running on port ${PORT}`);
            console.log(`📄 Swagger docs available at http://mealwhiz.at:${PORT}/api-docs`);
            // console.log(`🔗 API available at http://mealwhiz.at:${PORT}/`); // Adjusted if no /api/v1 prefix
        });
    } catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
};

startServer();
