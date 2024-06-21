import { Filter } from "@/utils/types";
import { Gene } from "@prisma/client";
import { FormEventHandler } from "react";

interface Props {
  filter: Filter;
  setFilter: React.Dispatch<React.SetStateAction<Filter>>;
  genes: Gene[];
  setFilteredGenes: React.Dispatch<React.SetStateAction<Gene[]>>;
  phenotypes: string[];
  grexes: string[];
}

const Inputs: React.FC<Props> = ({
  filter,
  setFilter,
  genes,
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
  };

  const handleFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, options } = event.target;
    const selectedValues = Array.from(options)
      .filter((option) => option.selected)
      .map((option) => option.value);

    const updatedFilter = {
      ...filter,
      [name]: selectedValues,
    };

    setFilter(updatedFilter);

    if (name === "phenotype") {
      if (selectedValues.length === 0)
        setFilteredGenes(
          genes.filter((gene) =>
            selectedValues.some((grex) => grex === gene.grex)
          )
        );
      else if (filter.grex.length !== 0)
        setFilteredGenes(
          genes
            .filter((gene) => filter.grex.some((grex) => gene.grex === grex))
            .filter((gene) =>
              selectedValues.some((phenotype) => gene.phenotype === phenotype)
            )
        );
      else
        setFilteredGenes(
          genes.filter((gene) =>
            selectedValues.some((phenotype) => gene.phenotype === phenotype)
          )
        );
    }

    if (name === "grex") {
      if (selectedValues.length === 0)
        setFilteredGenes(
          genes.filter((gene) =>
            selectedValues.some((phenotype) => phenotype === gene.phenotype)
          )
        );
      else if (filter.phenotype.length !== 0)
        setFilteredGenes(
          genes
            .filter((gene) =>
              filter.phenotype.some((phenotype) => gene.phenotype === phenotype)
            )
            .filter((gene) => selectedValues.some((grex) => gene.grex === grex))
        );
      else
        setFilteredGenes(
          genes.filter((gene) =>
            selectedValues.some((grex) => gene.grex === grex)
          )
        );
    }
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <div className="border rounded-lg p-6">
      <form className="flex flex-col gap-2" onSubmit={onSubmit}>
        <label>
          Phenotype
          <select
            name="phenotype"
            className="border px-4 py-2 rounded-lg w-40"
            onChange={handleFilterChange}
            value={filter.phenotype}
            multiple
          >
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
            onChange={handleFilterChange}
            value={filter.grex}
            multiple
          >
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

        <label>
          Correction Method
          <select
            name="correction"
            className="border px-4 py-2 rounded-lg w-40"
            onChange={handleInputChange}
            value={filter.correction}
          >
            <option value=""></option>
            <option value="bonferroni">Bonferroni</option>
            <option value="FDR">FDR</option>
          </select>
        </label>
      </form>
    </div>
  );
};

export default Inputs;
