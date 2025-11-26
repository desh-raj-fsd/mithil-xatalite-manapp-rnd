import { excelToJSON } from "./excelParser.js";
import { extractData } from "./extract_data.js";
import {
  seedBusServices,
  seedStops,
  seedRoutes,
  seedTrips,
  seedRouteStops,
  seedStopTimes,
} from "./seeding.js";

async function convertAndExtract() {
  try {
    const result = await excelToJSON(
      "./src/XLSX/data.xlsx",
      "output",
      "Table_2",
      "./src/JSON"
    );

    console.log("\n--- Excel conversion complete ---\n");
  } catch (error) {
    console.error("Error:", error);
  }
}

convertAndExtract();

try {
  extractData();
} catch (error) {
  console.error("Error: ", error);
}

async function seedDatabase() {
  await seedBusServices();
  await seedStops();
  await seedRoutes();
  await seedRouteStops();
  await seedTrips();
}


