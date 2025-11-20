import { excelToJSON, extractFieldFromJSON } from "./excelParser.js";
import { extractData } from "./extract_data.js";

async function convertAndExtract() {
  try {
    const result = await excelToJSON(
      "./XLSX/data.xlsx",
      "output",
      "Table_2",
      "./JSON"
    );

    console.log("\n--- Excel conversion complete ---\n");
;
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
