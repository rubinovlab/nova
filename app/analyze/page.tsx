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
import DoubleManhattan from "@/components/DoubleManhattan";
import * as d3 from "d3";

export default function Home() {
  const [genes, setGenes] = useState<Gene[]>([]);
  const [filter, setFilter] = useState<Filter>({
    line: 0.05,
    phenotype: [],
    grex: [],
    correction: "FDR",
  });
  const [filteredGenes, setFilteredGenes] = useState<Gene[]>([]);
  const [phenotypes, setPhenotypes] = useState<string[]>([]);
  const [grexes, setGrexes] = useState<string[]>([]);
  const [highlightedGene, setHighlightedGene] = useState<Gene>();
  const [lineY, setLineY] = useState<number>(0);
  const [prevLineY, setPrevLineY] = useState<number>(0);
  const [grexVolData, setGrexVolData] = useState<GrexVol>({
    grexes: [],
    volumes: [],
  });
  const [r2, setR2] = useState<number>(0);

  // fetch existing data from database
  const fetchData = async () => {
    try {
      const response = await axios.get("/api/fetch");
      setGenes(response.data.data.filter((gene: Gene) => gene.chromosome));
    } catch (error) {
      console.error("Error fetching data: ", error);
    }
  };

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
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchHighlightedGeneData();
  }, [highlightedGene]);

  return (
    <main className="px-10">
      <div className="flex flex-col pb-20">
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
            radius={2}
          />
        </div>
        <div>
          <div className="py-6 flex gap-10">
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
      </div>
    </main>
  );
}
