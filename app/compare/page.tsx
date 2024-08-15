"use client";

import ManhattanPlot from "@/components/Manhattan";
import { useEffect, useState } from "react";
import { Filter, GrexVol } from "@/utils/types";
import axios from "axios";
import Inputs from "@/components/Inputs";
import Genes from "@/components/Genes";
import { Gene } from "@prisma/client";
import GeneHighlight from "@/components/GeneHighlight";
import GrexPlot from "@/components/GrexPlot";
import Heatmap from "@/components/Heatmap";
import DoubleManhattan from "@/components/DoubleManhattan";

export default function Home() {
  // state for compact view
  const [compact, setCompact] = useState<boolean>(false);

  // check if data has been imported to extend view
  const [dataImported1, setDataImported1] = useState<boolean>(false);
  const [dataImported2, setDataImported2] = useState<boolean>(false);

  // first set of genes
  const [genes, setGenes] = useState<Gene[]>([]);

  // first filter
  const [filter, setFilter] = useState<Filter>({
    line: 0.05,
    phenotype: [],
    grex: [],
    correction: "FDR",
  });

  // state for filtered genes based on filter
  const [filteredGenes, setFilteredGenes] = useState<Gene[]>([]);

  //list of phenotypes
  const [phenotypes, setPhenotypes] = useState<string[]>([]);

  // list of grexes
  const [grexes, setGrexes] = useState<string[]>([]);

  // track highlighted gene
  const [highlightedGene, setHighlightedGene] = useState<Gene>();

  // height of line, unused
  const [lineY, setLineY] = useState<number>(0);

  //unused
  const [prevLineY, setPrevLineY] = useState<number>(0);

  // data for grexvol scatter plot
  const [grexVolData, setGrexVolData] = useState<GrexVol>({
    grexes: [],
    volumes: [],
  });
  const [r2, setR2] = useState<number>(0);

  // second set of genes and corresponding data
  const [genes2, setGenes2] = useState<Gene[]>([]);
  const [filter2, setFilter2] = useState<Filter>({
    line: 0.05,
    phenotype: [],
    grex: [],
    correction: "FDR",
  });
  const [filteredGenes2, setFilteredGenes2] = useState<Gene[]>([]);
  const [phenotypes2, setPhenotypes2] = useState<string[]>([]);
  const [grexes2, setGrexes2] = useState<string[]>([]);
  const [highlightedGene2, setHighlightedGene2] = useState<Gene>();
  const [lineY2, setLineY2] = useState<number>(0);
  const [prevLineY2, setPrevLineY2] = useState<number>(0);
  const [grexVolData2, setGrexVolData2] = useState<GrexVol>({
    grexes: [],
    volumes: [],
  });
  const [r22, setR22] = useState<number>(0);

  // fetch existing data from database
  const fetchData = async () => {
    try {
      const response = await axios.get("/api/fetch");
      setGenes(response.data.data.filter((gene: Gene) => gene.chromosome));
      const response2 = await axios.get("/api/fetch2");
      setGenes2(response2.data.data.filter((gene: Gene) => gene.chromosome));
    } catch (error) {
      console.error("Error fetching data: ", error);
    }
  };

  // find data for grexvol plot based on highlighted gene
  const fetchHighlightedGeneData = async () => {
    if (highlightedGene) {
      const response = await axios.post(`/api/grex-vol`, {
        geneId: highlightedGene.geneId,
        grex: highlightedGene.grex,
        phenotype: highlightedGene.phenotype,
      });
      setGrexVolData({
        volumes: response.data.volumes[0].volumes,
        grexes: response.data.grexes[0].grexes,
      });
    }
    if (highlightedGene2) {
      const response = await axios.post(`/api/grex-vol`, {
        geneId: highlightedGene2.geneId,
        grex: highlightedGene2.grex,
        phenotype: highlightedGene2.phenotype,
      });
      setGrexVolData2({
        volumes: response.data.volumes[0].volumes,
        grexes: response.data.grexes[0].grexes,
      });
    }
  };

  // fetch data on page render
  useEffect(() => {
    fetchData();
  }, []);

  // update highlighted gene data when changed
  useEffect(() => {
    fetchHighlightedGeneData();
  }, [highlightedGene, highlightedGene2]);

  return (
    <main className="px-10">
      {dataImported2 ? (
        <div className="flex gap-2 justify-center">
          <p
            onClick={() => setCompact(true)}
            className="border border-black rounded-full px-4 py-2 cursor-pointer hover:border-gray-600 hover:text-gray-600"
          >
            Compact
          </p>
          <p
            onClick={() => setCompact(false)}
            className="border border-black rounded-full px-4 py-2 cursor-pointer hover:border-gray-600 hover:text-gray-600"
          >
            Expanded
          </p>
        </div>
      ) : (
        ""
      )}

      <div className="justify-center flex">
        {!dataImported1 ? (
          <p
            className="px-6 py-3 border border-black text-xl rounded-2xl cursor-pointer hover:text-gray-500 hover:border-gray-500"
            onClick={() => setDataImported1(true)}
          >
            + Import Data
          </p>
        ) : (
          ""
        )}
      </div>

      {dataImported1 ? (
        <div className={`flex ${compact ? "pb-4" : "pb-20"} flex-col`}>
          <div className="flex">
            <Inputs
              filter={filter}
              setFilter={setFilter}
              genes={genes}
              setFilteredGenes={setFilteredGenes}
              phenotypes={phenotypes}
              grexes={grexes}
            />
            <ManhattanPlot
              genes={genes}
              filteredGenes={filteredGenes}
              filter={filter}
              setFilter={setFilter}
              setPhenotypes={setPhenotypes}
              setGrexes={setGrexes}
              highlighedGene={highlightedGene}
              lineY={lineY}
              setLineY={setLineY}
              prevLineY={prevLineY}
              setPrevLineY={setPrevLineY}
              heightParam={960}
              widthParam={420}
              radius={1.5}
              upsideDown={false}
            />
          </div>
          {compact ? (
            ""
          ) : (
            <div>
              <div className="px-10 py-6 flex gap-10">
                <Genes
                  genes={genes}
                  filteredGenes={filteredGenes}
                  filter={filter}
                  highlightedGene={highlightedGene}
                  setHighlightedGene={setHighlightedGene}
                />
                <GeneHighlight
                  highlighedGene={highlightedGene}
                  grexVolData={grexVolData}
                  filter={filter}
                />
              </div>
            </div>
          )}

          <div className="justify-center flex">
            {!dataImported2 ? (
              <p
                className="px-6 py-3 border border-black text-xl rounded-full cursor-pointer hover:text-gray-500 hover:border-gray-500"
                onClick={() => setDataImported2(true)}
              >
                + Import Second Dataset
              </p>
            ) : (
              ""
            )}
          </div>
        </div>
      ) : (
        <div></div>
      )}

      {dataImported2 ? (
        <div className="flex pb-20 flex-col">
          <div className="flex">
            <Inputs
              filter={filter2}
              setFilter={setFilter2}
              genes={genes2}
              setFilteredGenes={setFilteredGenes2}
              phenotypes={phenotypes2}
              grexes={grexes2}
            />
            <ManhattanPlot
              genes={genes2}
              filteredGenes={filteredGenes2}
              filter={filter2}
              setFilter={setFilter2}
              setPhenotypes={setPhenotypes2}
              setGrexes={setGrexes2}
              highlighedGene={highlightedGene2}
              lineY={lineY2}
              setLineY={setLineY2}
              prevLineY={prevLineY2}
              setPrevLineY={setPrevLineY2}
              heightParam={960}
              widthParam={420}
              radius={1.5}
              upsideDown={compact}
            />
          </div>
          {compact ? (
            ""
          ) : (
            <div>
              <div className="px-10 py-6 flex gap-10">
                <Genes
                  genes={genes2}
                  filteredGenes={filteredGenes2}
                  filter={filter2}
                  highlightedGene={highlightedGene}
                  setHighlightedGene={setHighlightedGene2}
                />
                <GeneHighlight
                  highlighedGene={highlightedGene2}
                  grexVolData={grexVolData2}
                  filter={filter2}
                />
              </div>
            </div>
          )}

          <div className="flex gap-4 justify-between">
            <Heatmap
              genes={genes}
              filteredGenes={filteredGenes}
              phenotypes={phenotypes}
              genes2={genes2}
              filteredGenes2={filteredGenes2}
              phenotypes2={phenotypes2}
              filter={filter}
              filter2={filter2}
              normalize={true}
            />
            <DoubleManhattan genes={genes} genes2={genes2} />
          </div>
        </div>
      ) : (
        <div></div>
      )}
    </main>
  );
}
