const fs = require("fs");
const readline = require("readline");
const csv = require("csv-parser");
const axios = require("axios");

// import errors and main function defined already errors are okay

// define types
interface GenePosition {
  chromosome: string;
  startPosition: number;
  endPosition: number;
  geneId: string;
}

interface GenePValue {
  geneId: string;
  pValue: number;
  phenotype: string;
  grex: string;
  beta: number;
  geneSymbol: string;
  bonferroni: number;
  FDR: number;
}

interface CombinedGeneData {
  chromosome: string;
  startPosition: number;
  endPosition: number;
  geneId: string;
  pValue: number;
  phenotype: string;
  grex: string;
  beta: number;
  geneSymbol: string;
  bonferroni: number;
  FDR: number;
}

// function to parse bed file to obtain start and end positions for genes
async function parseBedFile(filePath: string): Promise<GenePosition[]> {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const genes: GenePosition[] = [];
  for await (const line of rl) {
    // destructure each line into the chromosome, start pos, end pos, and geneId
    const [chromosome, startPosition, endPosition, geneId] = line.split(/\t/);
    genes.push({
      chromosome,
      startPosition: parseInt(startPosition, 10),
      endPosition: parseInt(endPosition, 10),
      geneId,
    });
  }

  return genes;
}

// function to read csv file with gene data like pvalue and other data
async function parseCsvFile(filePath: string): Promise<GenePValue[]> {
  const results: GenePValue[] = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data: any) => {
        // push each line in the csv file into results
        results.push({
          geneId: data.ens,
          pValue: parseFloat(data.pval),
          phenotype: data.phen,
          grex: data.grex,
          beta: parseFloat(data.beta),
          geneSymbol: data.sym,
          bonferroni: parseFloat(data.BON),
          FDR: parseFloat(data.FDR),
        });
      })
      .on("end", () => resolve(results))
      .on("error", (error: any) => reject(error));
  });
}

// merge data by matching gene data with gene positions
function combineData(
  positions: GenePosition[],
  genes: GenePValue[]
): CombinedGeneData[] {
  // map geneId to gene
  const genePositionMap = new Map(positions.map((gene) => [gene.geneId, gene]));

  // if gene exists in the map, a start and end pos exists for the gene, then merge data
  // if gene does not exist, put -1 for positions
  const combinedData = genes.map((gene) => {
    const positionData = genePositionMap.get(gene.geneId);
    if (positionData) {
      return {
        ...gene,
        chromosome: positionData.chromosome,
        startPosition: positionData.startPosition,
        endPosition: positionData.endPosition,
      };
    } else {
      return {
        ...gene,
        chromosome: "",
        startPosition: -1,
        endPosition: -1,
      };
    }
  });

  return combinedData;
}

// main function to run scripts
async function main() {
  const txtFilePath = "data/gene_positions.bed";
  const csvFilePath = "data/biovu_twas(in).csv";

  const genes = await parseBedFile(txtFilePath);
  const pValues = await parseCsvFile(csvFilePath);
  const combinedData = combineData(genes, pValues);

  // upload (POST) combined data to database
  try {
    const response = await axios.post("http://localhost:3000/api/insert", {
      combinedData,
    });
    console.log(response.data);
  } catch (error) {
    console.error("Error inserting data:", error);
  }
}

main().catch((error) => console.error(error));
