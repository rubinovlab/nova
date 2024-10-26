const fs = require("fs");
const readline = require("readline");
const csv = require("csv-parser");
const axios = require("axios");

// Define the GenePosition interface
interface GenePosition {
  chromosome: string;
  start: number;
  end: number;
  geneID: string;
}

// Function to parse a BED file to obtain start and end positions for genes
async function parseBedFile(filePath: string): Promise<GenePosition[]> {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const genes: GenePosition[] = [];
  let isFirstLine = true; // Flag to skip the header line

  for await (const line of rl) {
    if (isFirstLine) {
      isFirstLine = false; // Skip the first line (header)
      continue;
    }

    // Destructure each line into the chromosome, start position, end position, and geneId
    const [chromosome, start, end, gene_id] = line.split(/\t/);

    genes.push({
      chromosome: chromosome,
      start: parseInt(start, 10),
      end: parseInt(end, 10),
      geneID: gene_id,
    });
  }

  return genes;
}

// Main function to parse gene positions and upload them to the database
async function main() {
  const txtFilePath = "data/gene_positions.bed"; // Path to the BED file containing gene positions

  // Parse gene positions from the BED file
  const genePositions = await parseBedFile(txtFilePath);

  if (genePositions.length === 0) {
    console.error("No valid gene positions found.");
    return;
  }

  // Upload (POST) gene positions to the database
  try {
    const response = await axios.post(
      "http://localhost:3000/api/insert-positions",
      {
        genePositions: genePositions, // Upload parsed and validated positions
      }
    );
    console.log(response.data);
  } catch (error) {
    console.error("Error inserting data:", error);
  }
}

// Execute the main function
main().catch((error) => console.error(error));
