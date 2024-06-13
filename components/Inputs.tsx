import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import axios from "axios";
import { Filter } from "@/utils/types";
import { Gene } from "@prisma/client";

interface Props {
  filter: Filter;
  setFilter: React.Dispatch<React.SetStateAction<Filter>>;
  genes: Gene[];
  filteredGenes: Gene[];
  setFilteredGenes: React.Dispatch<React.SetStateAction<Gene[]>>;
  phenotypes: string[];
  grexes: string[];
}

const Inputs: React.FC<Props> = ({
  filter,
  setFilter,
  genes,
  filteredGenes,
  setFilteredGenes,
  phenotypes,
  grexes,
}) => {
  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    const parsedValue = name === "line" ? parseFloat(value) : value;
    setFilter({
      ...filter,
      [name]: parsedValue,
    });

    if (name === "phenotype") {
      if (value === "")
        setFilteredGenes(genes.filter((gene) => gene.grex === filter.grex));
      else if (filter.grex !== "")
        setFilteredGenes(
          genes
            .filter((gene) => gene.grex === filter.grex)
            .filter((gene) => gene.phenotype === value)
        );
      else setFilteredGenes(genes.filter((gene) => gene.phenotype === value));
    }
    if (name === "grex") {
      if (value === "")
        setFilteredGenes(
          genes.filter((gene) => gene.phenotype === filter.phenotype)
        );
      else if (filter.phenotype !== "")
        setFilteredGenes(
          genes
            .filter((gene) => gene.phenotype === filter.phenotype)
            .filter((gene) => gene.grex === value)
        );
      else setFilteredGenes(genes.filter((gene) => gene.grex === value));
    }
  };

  return (
    <div className="border rounded-lg p-6">
      <form className="flex flex-col gap-2">
        <label>
          Phenotype
          <select
            name="phenotype"
            className="border px-4 py-2 rounded-lg w-40"
            onChange={handleInputChange}
            value={filter.phenotype}
          >
            <option value=""></option>
            {phenotypes.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label>
          Gene Expression Site
          <select
            name="grex"
            className="border px-4 py-2 rounded-lg w-40"
            onChange={handleInputChange}
            value={filter.grex}
          >
            <option value=""></option>
            {grexes.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label>
          P-Value
          <input
            type="number"
            name="line"
            step="0.00001"
            className="border px-4 py-2 rounded-lg w-40"
            onChange={handleInputChange}
            value={filter.line}
          />
        </label>
      </form>
    </div>
  );
};

export default Inputs;
