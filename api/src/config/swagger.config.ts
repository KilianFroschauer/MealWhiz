import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Mealwhiz API",
      version: "1.0.0",
      description: "API for recipes and cooking events",
    },
    servers: [
      {
        url: process.env.API_URL || "http://localhost:3000",
      },
    ],
    tags: [
      {
        name: "recipe",
        description: "Recipe operations"
      },
      {
        name: "Cookoff",
        description: "API endpoints for managing cooking events"
      },
      {
        name: "Authentication",
        description: "User authentication and management"
      },
      {
        name: "Cart",
        description: "Shopping cart management"
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        }
      }
    },
  },
  apis: ["./src/routes/*.ts"],
};

/**
 * Sets up Swagger documentation for the API.
 * @param app Express application instance
 */
export function setupSwagger(app: Express) {
  try {
    const swaggerDocs = swaggerJsDoc(swaggerOptions);

    // Custom options for Swagger UI
    const options = {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: "MealWhiz API Documentation"
    };

    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs, options));

    console.log("✅ Swagger documentation initialized");
  } catch (error) {
    console.error("❌ Error initializing Swagger documentation:", error);
  }
}
