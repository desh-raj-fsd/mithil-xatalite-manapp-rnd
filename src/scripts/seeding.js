import { XataClient } from "../xata.js";
import fs from "fs/promises";
import "dotenv/config";

// Helper to build FK mapping (natural id -> xata id)
async function buildIdMap(xata, table, naturalKey) {
  const records = await xata.db[table].getAll();
  const map = {};
  for (const row of records) map[row[naturalKey]] = row.xata_id;
  return map;
}

async function seedBusServices() {
  const xata = new XataClient({
    apiKey: process.env.XATA_API_KEY,
    branch: "main",
  });
  const data = await fs.readFile("./src/JSON/bus_services.json", "utf-8");
  const busServices = JSON.parse(data);

  // No explicit id
  for (const service of busServices) {
    try {
      await xata.db.bus_services.create({
        service_number: service.service_number,
        service_name: service.service_name,
        description: service.description,
      });
    } catch (error) {
      console.error(
        `Error inserting service ${service.service_number}:`,
        error
      );
    }
  }
}

async function seedStops() {
  const xata = new XataClient({
    apiKey: process.env.XATA_API_KEY,
    branch: "main",
  });
  const data = await fs.readFile("./src/JSON/stops.json", "utf-8");
  const stops = JSON.parse(data);
  for (const stop of stops) {
    try {
      await xata.db.stops.create({
        stop_name: stop.stop_name,
        description: stop.description,
      });
    } catch (error) {
      console.error(`Error inserting stop ${stop.stop_name}:`, error);
    }
  }
}

async function seedRoutes() {
  const xata = new XataClient({
    apiKey: process.env.XATA_API_KEY,
    branch: "main",
  });
  const data = await fs.readFile("./src/JSON/routes.json", "utf-8");
  const routes = JSON.parse(data);
  // Lookup services by number for FK
  const serviceMap = await buildIdMap(xata, "bus_services", "service_number");
  for (const route of routes) {
    try {
      await xata.db.routes.create({
        route_name: route.route_name,
        service_id: serviceMap[route.service_number], // route.service_id is the old numeric key, now use FK
      });
    } catch (error) {
      console.error(`Error inserting route ${route.route_name}:`, error);
    }
  }
}

async function seedTrips() {
  const xata = new XataClient({
    apiKey: process.env.XATA_API_KEY,
    branch: "main",
  });
  const data = await fs.readFile("./src/JSON/trips.json", "utf-8");
  const trips = JSON.parse(data);
  const routeMap = await buildIdMap(xata, "routes", "route_name");
  const serviceMap = await buildIdMap(xata, "bus_services", "service_number");

  for (const trip of trips) {
    try {
      // Always coerce start_time to integer, handle strings like "0851"
      let intStart = parseInt(trip.start_time, 10);
      if (isNaN(intStart)) {
        console.warn(
          `Skipping invalid start_time on trip ${trip.trip_id}:`,
          trip.start_time
        );
        continue; // Or set intStart = 0 if preferred
      }
      await xata.db.trips.create({
        trip_id: trip.trip_id,
        start_time: intStart,
        day_of_week: trip.day_of_week,
        route_id: routeMap[trip.route_name],
        service_id: serviceMap[trip.service_number],
        // column_reference: trip.column_reference,
      });
    } catch (error) {
      console.error(`Error inserting trip ${trip.trip_id}:`, error);
    }
  }
}

async function seedRouteStops() {
  const xata = new XataClient({
    apiKey: process.env.XATA_API_KEY,
    branch: "main",
  });
  const data = await fs.readFile("./src/JSON/route_stops.json", "utf-8");
  const routeStops = JSON.parse(data);
  const routeMap = await buildIdMap(xata, "routes", "route_id");
  const stopMap = await buildIdMap(xata, "stops", "stop_id");
  for (const rs of routeStops) {
    try {
      await xata.db.route_stops.create({
        route_stop_id: rs.route_stop_id,
        route_id: routeMap[rs.route_id],
        stop_id: stopMap[rs.stop_id],
        sequence_number: rs.sequence_number,
      });
    } catch (error) {
      console.error(
        `Error inserting route stop seq ${rs.sequence_number}:`,
        error
      );
    }
  }
}

async function seedStopTimes() {
  const xata = new XataClient({
    apiKey: process.env.XATA_API_KEY,
    branch: "main",
  });
  const data = await fs.readFile("./src/JSON/stop_times.json", "utf-8");
  const stopTimes = JSON.parse(data);
  const tripMap = await buildIdMap(xata, "trips", "trip_id");
  const rsMap = await buildIdMap(xata, "route_stops", "route_stop_id");
  for (const st of stopTimes) {
    try {
      await xata.db.stop_times.create({
        trip_id: tripMap[st.trip_id],
        route_stop_id: rsMap[st.route_stop_id],
        is_skipped: st.is_skipped,
        departure_time: st.departure_time,
      });
    } catch (error) {
      console.error(`Error inserting stop time seq ${st.stop_time_id}`, error);
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

export {
  seedBusServices,
  seedStops,
  seedRoutes,
  seedTrips,
  seedRouteStops,
  seedStopTimes,
};
