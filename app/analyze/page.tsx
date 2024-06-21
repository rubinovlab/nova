"use client";

import ManhattanPlot from "@/components/Manhattan";
import { useEffect, useState } from "react";
import { Filter } from "@/utils/types";
import axios from "axios";
import Inputs from "@/components/Inputs";
import Genes from "@/components/Genes";
import { Gene } from "@prisma/client";
import GeneHighlight from "@/components/GeneHighlight";

export default function Home() {
  const [genes, setGenes] = useState<Gene[]>([]);
  const [filter, setFilter] = useState<Filter>({
    line: 0.0001,
    phenotype: [],
    grex: [],
    correction: "",
  });
  const [filteredGenes, setFilteredGenes] = useState<Gene[]>([]);
  const [phenotypes, setPhenotypes] = useState<string[]>([]);
  const [grexes, setGrexes] = useState<string[]>([]);
  const [highlightedGene, setHighlightedGene] = useState<Gene>();
  const [lineY, setLineY] = useState<number>(0);
  const [prevLineY, setPrevLineY] = useState<number>(0);

  // fetch existing data from database
  const fetchData = async () => {
    try {
      const response = await axios.get("/api/fetch");
      setGenes(response.data.data.filter((gene: Gene) => gene.chromosome));
    } catch (error) {
      console.error("Error fetching data: ", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <main className="px-10">
      <div className="flex justify-between mb-10">
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
        />
      </div>
      <div className="flex gap-4">
        <Genes
          genes={genes}
          filteredGenes={filteredGenes}
          filter={filter}
          setHighlightedGene={setHighlightedGene}
        />
        <GeneHighlight highlighedGene={highlightedGene} />
      </div>
    </main>
  );
}
