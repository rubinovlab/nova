const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const csv = require("csv-parser");
const axios = require("axios");

// import errors and main function defined already errors are okay

// define grex type
interface Grex {
  geneId: string;
  grexes: number[];
  grex: string;
}

const filePaths = [
  path.resolve("data/subset_grex/amygdala.hdf5"),
  path.resolve("data/subset_grex/anterior-cingulate.hdf5"),
  path.resolve("data/subset_grex/caudate.hdf5"),
  path.resolve("data/subset_grex/cerebellar-hemisphere.hdf5"),
  path.resolve("data/subset_grex/dlpfc.hdf5"),
  path.resolve("data/subset_grex/hippocampus.hdf5"),
  path.resolve("data/subset_grex/nucleus-accumbens.hdf5"),
  path.resolve("data/subset_grex/putamen.hdf5"),
];

const phenotypes = [
  "amygdala",
  "anterior-cingulate",
  "caudate",
  "cerebellar-hemisphere",
  "dlpfc",
  "hippocampus",
  "nucleus-accumbens",
  "putamen",
];

const grexes: Grex[] = [];

const volumesHippocampus: number[] = [];
const volumesAmygdala: number[] = [];
const volumesNucleusAccumbens: number[] = [];
const volumesPutamen: number[] = [];
const volumesCaudate: number[] = [];
const volumesCerebellarHemisphere: number[] = [];
const volumesAnteriorCingulate: number[] = [];
const volumesDlpfc: number[] = [];

// obtain volumes from csv file
function parseCsv() {
  return new Promise<void>((resolve, reject) => {
    fs.createReadStream(path.resolve("data/vol_mean.csv"))
      .pipe(csv())
      .on("data", (data: any) => {
        // data is stored in one long string so data is separated by whitespace
        const key = Object.keys(data)[0];
        const valuesAsString = data[key];
        const values = valuesAsString.split(/\s+/);

        volumesHippocampus.push(parseFloat(values[1]));
        volumesAmygdala.push(parseFloat(values[2]));
        volumesNucleusAccumbens.push(parseFloat(values[3]));
        volumesPutamen.push(parseFloat(values[4]));
        volumesCaudate.push(parseFloat(values[5]));
        volumesCerebellarHemisphere.push(parseFloat(values[6]));
        volumesAnteriorCingulate.push(parseFloat(values[7]));
        volumesDlpfc.push(parseFloat(values[8]));
      })
      .on("end", resolve)
      .on("error", reject);
  });
}

// run python script function, must run separately for each file
function parseHdf5(filePath: string, phenotype: string) {
  return new Promise<void>((resolve, reject) => {
    const pythonProcess = spawn("myenv/bin/python3", [
      "scripts/parse_hdf5.py",
      // update file path each time to process all data
      filePath,
    ]);

    let stdoutData = "";
    let stderrData = "";

    pythonProcess.stdout.on("data", (data: any) => {
      stdoutData += data.toString();
    });

    pythonProcess.stderr.on("data", (data: any) => {
      stderrData += data.toString();
    });

    pythonProcess.on("close", (code: number) => {
      if (code !== 0) {
        console.error(`Python script exited with code ${code}`);
        console.error(stderrData);
        reject(new Error(`Python script exited with code ${code}`));
        return;
      }

      // store data in grexes
      try {
        const data = JSON.parse(stdoutData);
        for (let i = 0; i < data.expression_matrix.length; i++) {
          grexes.push({
            geneId: data.gene_ids[i],
            grex: phenotype,
            grexes: data.expression_matrix[i],
          });
        }
        resolve();
      } catch (e: any) {
        console.error(`Failed to parse JSON: ${e.message}`);
        reject(e);
      }
    });
  });
}

async function main() {
  try {
    // upload volumes data to database
    await parseCsv();

    // create data that contains phenotype and its corresponding list of volumes
    const volumes = [
      { phenotype: "amygdala", data: volumesAmygdala.slice(0, 2000) },
      {
        phenotype: "anterior-cingulate",
        data: volumesAnteriorCingulate.slice(0, 2000),
      },
      { phenotype: "caudate", data: volumesCaudate.slice(0, 2000) },
      {
        phenotype: "cerebellar-hemisphere",
        data: volumesCerebellarHemisphere.slice(0, 2000),
      },
      {
        phenotype: "dlpfc",
        data: volumesDlpfc.slice(0, 2000),
      },
      {
        phenotype: "hippocampus",
        data: volumesHippocampus.slice(0, 2000),
      },
      {
        phenotype: "nucleus-accumbens",
        data: volumesNucleusAccumbens.slice(0, 2000),
      },
      {
        phenotype: "putamen",
        data: volumesPutamen.slice(0, 2000),
      },
    ];
    const response = await axios.post("http://localhost:3000/api/volumes", {
      volumes,
    });

    // PROCESS GREX DATA

    // // choose which file to process
    // // make sure the numbers are the same, e.g. (filePaths[0], phenotypes[0]), (filePaths[1], phenotypes[1]), etc.
    // await parseHdf5(filePaths[7], phenotypes[7]);
    // const batchSize = 500;

    // // batching to stop my laptop from crashing
    // for (let i = 0; i < grexes.length; i += batchSize) {
    //   const batch = grexes.slice(i, i + batchSize);
    //   const response = await axios.post("http://localhost:3000/api/grexes", {
    //     grexes: batch,
    //   });
    //   console.log(
    //     "Batch ",
    //     (i + batchSize) / batchSize,
    //     " inserted, ",
    //     response.data
    //   );
    // }
  } catch (error) {
    console.error("Error processing files:", error);
  }
}

main();
