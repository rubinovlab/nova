const fs = require("fs");
const readline = require("readline");
const csv = require("csv-parser");
const axios = require("axios");

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

async function parseBedFile(filePath: string): Promise<GenePosition[]> {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const genes: GenePosition[] = [];
  for await (const line of rl) {
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

async function parseCsvFile(filePath: string): Promise<GenePValue[]> {
  const results: GenePValue[] = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data: any) => {
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

function combineData(
  positions: GenePosition[],
  genes: GenePValue[]
): CombinedGeneData[] {
  const genePositionMap = new Map(positions.map((gene) => [gene.geneId, gene]));

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

async function main() {
  const txtFilePath = "data/gene_positions.bed";
  const csvFilePath = "data/twas.csv";

  const genes = await parseBedFile(txtFilePath);
  const pValues = await parseCsvFile(csvFilePath);
  const combinedData = combineData(genes, pValues);

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
