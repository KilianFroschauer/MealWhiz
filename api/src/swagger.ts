import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Recipe API",
      version: "1.0.0",
      description: "API for filtering recipes",
    },
    servers: [
      {
        url: "http://localhost:3000",
      },
    ],
    tags: [
      {
        name: "recipe",
        description: "Recipe operations"
      },
      {
        name: "cookoff", 
        description: "Cooking event operations"
      }
    ]
  },
  apis: ["./src/index.ts", "./src/recipe-router.ts", "./src/event-router.ts"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

export function setupSwagger(app: Express) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
}
