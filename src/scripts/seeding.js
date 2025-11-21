import { XataClient } from "../xata.js";
import fs from "fs/promises";
import "dotenv/config";

async function seedBusServices() {
  // Initialize Xata client with API key from env
  const xata = new XataClient({
    apiKey: process.env.XATA_API_KEY,
    branch: "main",
  });

  // Read JSON data from file
  const data = await fs.readFile("./src/JSON/bus_services.json", "utf-8");
  const busServices = JSON.parse(data);

  for (const service of busServices) {
    try {
      await xata.db.bus_services.create({
        service_id: service.service_id,
        service_number: service.service_number,
        service_name: service.service_name,
        description: service.description,
      });
      console.log(`Inserted service ${service.service_id}`);
    } catch (error) {
      console.error(`Error inserting service ${service.service_id}:`, error);
    }
  }

  console.log("Bus services seeding completed");
}

async function seedStops() {
  // Initialize Xata client with API key from env
  const xata = new XataClient({
    apiKey: process.env.XATA_API_KEY,
    branch: "main",
  });

  // Read JSON data from file
  const data = await fs.readFile("./src/JSON/stops.json", "utf-8");
  const stops = JSON.parse(data);

  for (const stop of stops) {
    try {
      await xata.db.stops.create({
        stop_id: stop.stop_id,
        stop_name: stop.stop_name,
        description: stop.description,
      });
      console.log(`Inserted stop ${stop.stop_id}`);
    } catch (error) {
      console.error(`Error inserting stop ${stop.stop_id}:`, error);
    }
  }

  console.log("Bus stops seeding completed");
}

async function seedRoutes() {
  // Initialize Xata client with API key from env
  const xata = new XataClient({
    apiKey: process.env.XATA_API_KEY,
    branch: "main",
  });

  // Read JSON data from file
  const data = await fs.readFile("./src/JSON/routes.json", "utf-8");
  const routes = JSON.parse(data);

  for (const route of routes) {
    try {
      await xata.db.routes.create({
        route_id: route.route_id,
        route_name: route.route_name,
        service_id: route.service_id,
      });
      console.log(`Inserted route ${route.route_id}`);
    } catch (error) {
      console.error(`Error inserting route ${route.route_id}:`, error);
    }
  }

  console.log("Routes seeding completed");
}
export {seedBusServices, seedStops, seedRoutes}

