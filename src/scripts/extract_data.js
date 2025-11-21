import fs from "fs";
import { readFileSync } from "fs";

function extractData() {
  // Read the input data
  const rawData = JSON.parse(readFileSync("./src/JSON/output.json", "utf-8"));

  // Initialize data structures
  const busServices = [];
  const stops = [];
  const routes = [];
  const routeStops = [];
  const trips = [];
  const stopTimes = [];

  // Counters for IDs
  let serviceIdCounter = 1;
  let stopIdCounter = 1;
  let routeIdCounter = 1;
  let routeStopIdCounter = 1;
  let tripIdCounter = 101;
  let stopTimeIdCounter = 1001;

  // Map to store stop name to ID mapping
  const stopNameToId = new Map();

  // Map to store service number to ID mapping
  const serviceNumberToId = new Map();

  // Extract unique column headers (service numbers)
  const serviceColumns = Object.keys(rawData[0]).filter(
    (key) => key !== "Place" && !key.includes("_")
  );

  // Step 1: Extract all unique stops and create Stops table
  rawData.forEach((row) => {
    const stopName = row.Place;
    if (stopName && !stopNameToId.has(stopName)) {
      stops.push({
        stop_id: stopIdCounter,
        stop_name: stopName,
        description: "",
      });
      stopNameToId.set(stopName, stopIdCounter);
      stopIdCounter++;
    }
  });

  // Step 2: Extract unique services and create BusService table
  const allServiceNumbers = new Set();
  Object.keys(rawData[0]).forEach((key) => {
    if (key !== "Place") {
      // Extract base service number (remove suffixes like _1, _2, etc.)
      const baseService = key.split("_")[0];
      allServiceNumbers.add(baseService);
    }
  });

  allServiceNumbers.forEach((serviceNum) => {
    // Determine service name based on the route
    let serviceName = "";
    let description = "";

    if (serviceNum === "1" || serviceNum === "1a") {
      serviceName = "Noble's Hospital - Port Erin";
      description = "Main route between Noble's Hospital and Port Erin";
    } else if (serviceNum === "2") {
      serviceName = "Ballachrink - Port Erin";
      description = "Route between Ballachrink and Port Erin";
    } else if (serviceNum === "12" || serviceNum === "12a") {
      serviceName = "Willaston - Port Erin";
      description = "Route between Willaston and Port Erin via Castletown";
    }

    busServices.push({
      service_id: serviceIdCounter,
      service_number: serviceNum,
      service_name: serviceName,
      description: description,
    });

    serviceNumberToId.set(serviceNum, serviceIdCounter);
    serviceIdCounter++;
  });

  // Step 3: Create Routes (one route per service for this dataset)
  busServices.forEach((service) => {
    routes.push({
      route_id: routeIdCounter,
      service_id: "",
      route_name: service.service_name,
    });
    routeIdCounter++;
  });

  // Step 4: Create RouteStops for each route
  // For each service, extract the sequence of stops
  allServiceNumbers.forEach((serviceNum) => {
    const serviceId = serviceNumberToId.get(serviceNum);
    const routeId = serviceId; // In this case, route_id matches service_id

    let sequenceNumber = 1;

    rawData.forEach((row) => {
      const stopName = row.Place;
      const stopId = stopNameToId.get(stopName);

      // Check if this service stops at this location
      // Look for any column that starts with this service number
      const hasStop = Object.keys(row).some((key) => {
        const baseService = key.split("_")[0];
        return (
          baseService === serviceNum && row[key] !== "-" && row[key] !== ""
        );
      });

      if (hasStop) {
        routeStops.push({
          route_stop_id: routeStopIdCounter,
          route_id: "",
          stop_id: "",
          sequence_number: sequenceNumber,
        });
        routeStopIdCounter++;
        sequenceNumber++;
      }
    });
  });

  // Step 5: Create Trips
  // Each column represents a different trip for that service
  Object.keys(rawData[0]).forEach((columnKey) => {
    if (columnKey === "Place") return;

    const baseService = columnKey.split("_")[0];
    const serviceId = serviceNumberToId.get(baseService);
    const routeId = serviceId;

    // Find the first non-empty time in this column to use as start_time
    let startTime = null;
    for (let row of rawData) {
      if (row[columnKey] && row[columnKey] !== "-") {
        startTime = row[columnKey];
        break;
      }
    }

    if (startTime) {
      trips.push({
        trip_id: tripIdCounter,
        route_id: "",
        service_id: "",
        start_time: startTime,
        day_of_week: "Weekday",
        column_reference: columnKey,
      });

      // Step 6: Create StopTimes for this trip
      const currentTripId = tripIdCounter;

      // Get all route stops for this route
      const routeStopsForRoute = routeStops.filter(
        (rs) => rs.route_id === routeId
      );

      routeStopsForRoute.forEach((routeStop) => {
        const stopName = stops.find(
          (s) => s.stop_id === routeStop.stop_id
        ).stop_name;
        const rowData = rawData.find((r) => r.Place === stopName);

        const departureTime = rowData[columnKey];
        const isSkipped = !departureTime || departureTime === "-";

        stopTimes.push({
          stop_time_id: stopTimeIdCounter,
          trip_id: "",
          route_stop_id: "",
          departure_time: isSkipped ? null : departureTime,
          is_skipped: isSkipped,
        });

        stopTimeIdCounter++;
      });

      tripIdCounter++;
    }
  });

  // Write all data to separate JSON files
  fs.writeFileSync(
    "./src/JSON/bus_services.json",
    JSON.stringify(busServices, null, 2)
  );
  fs.writeFileSync("./src/JSON/stops.json", JSON.stringify(stops, null, 2));
  fs.writeFileSync("./src/JSON/routes.json", JSON.stringify(routes, null, 2));
  fs.writeFileSync(
    "./src/JSON/route_stops.json",
    JSON.stringify(routeStops, null, 2)
  );
  fs.writeFileSync("./src/JSON/trips.json", JSON.stringify(trips, null, 2));
  fs.writeFileSync(
    "./src/JSON/stop_times.json",
    JSON.stringify(stopTimes, null, 2)
  );

  console.log("✅ Data extraction complete!");
  console.log(`   - ${busServices.length} bus services`);
  console.log(`   - ${stops.length} stops`);
  console.log(`   - ${routes.length} routes`);
  console.log(`   - ${routeStops.length} route stops`);
  console.log(`   - ${trips.length} trips`);
  console.log(`   - ${stopTimes.length} stop times`);
  console.log("\nOutput files created:");
  console.log("   - bus_services.json");
  console.log("   - stops.json");
  console.log("   - routes.json");
  console.log("   - route_stops.json");
  console.log("   - trips.json");
  console.log("   - stop_times.json");
}

export { extractData };
