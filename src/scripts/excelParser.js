import XLSX from "xlsx";
import fs from "fs";
import path from "path";

function parseExcelFile(filePath, sheetName = null) {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheet = sheetName || workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheet];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`Parsed ${data.length} rows from sheet: ${sheet}`);
    return data;
  } catch (error) {
    console.error("Error parsing Excel file:", error);
    throw error;
  }
}


function transformData(excelData) {
  return excelData.map((row) => {
    return {
      ...row,
    };
  });
}

function saveToJSON(data, outputFileName, outputDir = "./") {
  try {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Create full file path
    const fileName = outputFileName.endsWith(".json")
      ? outputFileName
      : `${outputFileName}.json`;
    const filePath = path.join(outputDir, fileName);

    // Check if file exists
    if (fs.existsSync(filePath)) {
      console.log(`File ${fileName} already exists. Replacing...`);
    }

    // Write JSON file (this will overwrite if exists)
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");

    console.log(`✓ Successfully saved ${data.length} records to ${filePath}`);
    return filePath;
  } catch (error) {
    console.error("Error saving JSON file:", error);
    throw error;
  }
}

function parseAllSheetsToJSON(filePath, outputDir = "./") {
  try {
    const workbook = XLSX.readFile(filePath);
    const results = [];

    console.log(`Found ${workbook.SheetNames.length} sheets in workbook`);

    workbook.SheetNames.forEach((sheetName) => {
      console.log(`\nProcessing sheet: ${sheetName}`);
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      if (data.length > 0) {
        const sanitizedName = sheetName.replace(/[^a-z0-9]/gi, "_");
        const outputPath = saveToJSON(data, sanitizedName, outputDir);
        results.push({
          sheet: sheetName,
          file: outputPath,
          records: data.length,
        });
      } else {
        console.log(`Sheet ${sheetName} is empty, skipping...`);
      }
    });

    return results;
  } catch (error) {
    console.error("Error processing sheets:", error);
    throw error;
  }
}


async function excelToJSON(
  filePath,
  outputFileName,
  sheetName = null,
  outputDir = "./",
  transform = false
) {
  try {
    console.log("Step 1: Parsing Excel file...");
    const excelData = parseExcelFile(filePath, sheetName);

    if (excelData.length === 0) {
      console.log("No data found in Excel file");
      return null;
    }

    console.log("Step 2: Processing data...");
    const processedData = transform ? transformData(excelData) : excelData;

    console.log("Step 3: Saving to JSON...");
    const savedPath = saveToJSON(processedData, outputFileName, outputDir);

    console.log(`\n✓ Conversion complete!`);
    return {
      filePath: savedPath,
      recordCount: processedData.length,
      data: processedData,
    };
  } catch (error) {
    console.error("Error in excelToJSON:", error);
    throw error;
  }
}


function extractFieldFromJSON(
  inputFilePath,
  fieldName,
  outputFileName,
  outputDir = "./"
) {
  try {
    console.log(`Reading JSON file: ${inputFilePath}`);

    // Read the input JSON file
    const fileContent = fs.readFileSync(inputFilePath, "utf-8");
    const data = JSON.parse(fileContent);

    if (!Array.isArray(data)) {
      throw new Error("Input JSON must be an array of objects");
    }

    console.log(`Extracting "${fieldName}" from ${data.length} entries...`);

    // Extract only the specified field from each entry
    const extractedData = data
      .map((entry) => {
        if (entry.hasOwnProperty(fieldName)) {
          return { [fieldName]: entry[fieldName] };
        }
        return null;
      })
      .filter((item) => item !== null);

    console.log(
      `Found ${extractedData.length} entries with "${fieldName}" field`
    );

    // Save to new JSON file
    const savedPath = saveToJSON(extractedData, outputFileName, outputDir);

    return {
      filePath: savedPath,
      recordCount: extractedData.length,
      data: extractedData,
    };
  } catch (error) {
    console.error("Error extracting field from JSON:", error);
    throw error;
  }
}

export {
  parseExcelFile,
  transformData,
  saveToJSON,
  excelToJSON,
  parseAllSheetsToJSON,
  extractFieldFromJSON,

};
