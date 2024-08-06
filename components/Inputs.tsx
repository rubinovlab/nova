import { Filter } from "@/utils/types";
import { Gene } from "@prisma/client";
import { FormEventHandler, useState } from "react";

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
  const [filterTemp, setFilterTemp] = useState<Filter>({
    line: 0.05,
    correction: "FDR",
    phenotype: [],
    grex: [],
  });

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    const parsedValue = name === "line" ? parseFloat(value) : value;
    setFilterTemp({
      ...filterTemp,
      [name]: parsedValue,
    });
  };

  const updateInputs = () => {
    setFilter(filterTemp);

    const { phenotype, grex } = filterTemp;

    let filteredGenes = genes;

    if (phenotype.length > 0) {
      filteredGenes = filteredGenes.filter((gene) =>
        phenotype.includes(gene.phenotype)
      );
    }

    if (grex.length > 0) {
      filteredGenes = filteredGenes.filter((gene) => grex.includes(gene.grex));
    }

    setFilteredGenes(filteredGenes);
  };

  const handleFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, options } = event.target;
    const selectedValues = Array.from(options)
      .filter((option) => option.selected)
      .map((option) => option.value);

    setFilterTemp({
      ...filterTemp,
      [name]: selectedValues,
    });
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  function generateGreenHexCodes(amount: number): string[] {
    const startColor = { r: 0, g: 128, b: 0 }; // Dark green
    const endColor = { r: 144, g: 238, b: 144 }; // Light green

    const hexCodes: string[] = [];

    for (let i = 0; i < amount; i++) {
      const ratio = i / (amount - 1);
      const r = Math.round(startColor.r + ratio * (endColor.r - startColor.r));
      const g = Math.round(startColor.g + ratio * (endColor.g - startColor.g));
      const b = Math.round(startColor.b + ratio * (endColor.b - startColor.b));

      const hexCode = `#${((1 << 24) + (r << 16) + (g << 8) + b)
        .toString(16)
        .slice(1)
        .toUpperCase()}`;
      hexCodes.push(hexCode);
    }

    return hexCodes;
  }
  const hexCodes = generateGreenHexCodes(phenotypes.length);

  return (
    <div className="border rounded-lg p-6 border-black">
      <form className="flex flex-col gap-2" onSubmit={onSubmit}>
        <label className="flex flex-col">
          Phenotype{" "}
          <span className="text-gray-400">
            (cmd/ctrl + click to select multiple)
          </span>
          <select
            name="phenotype"
            className="border border-black px-4 py-2 rounded-lg h-24 w-80"
            onChange={handleFilterChange}
            value={filterTemp.phenotype}
            multiple
          >
            {phenotypes.map((option, index) => (
              <option
                key={index}
                value={option}
                style={{ color: hexCodes[phenotypes.indexOf(option)] }}
              >
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col">
          gr-Expression
          <select
            name="grex"
            className="border border-black px-4 py-2 rounded-lg h-24 w-80"
            onChange={handleFilterChange}
            value={filterTemp.grex}
            multiple
          >
            {grexes.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <div className="flex gap-4">
          <label className="flex flex-col">
            P-Value
            <input
              type="number"
              name="line"
              step="0.00001"
              className="border border-black px-4 py-2 rounded-lg w-40"
              onChange={handleInputChange}
              value={filterTemp.line}
            />
          </label>

          <label className="flex flex-col">
            Correction Method
            <select
              name="correction"
              className="border border-black px-4 py-2 rounded-lg w-40 h-full"
              onChange={handleInputChange}
              value={filterTemp.correction}
            >
              <option value=""></option>
              <option value="bonferroni">Bonferroni</option>
              <option value="FDR">FDR</option>
            </select>
          </label>
        </div>
      </form>
      <p
        className="px-2 py-1 bg-black text-white rounded-full text-center mt-3 cursor-pointer hover:bg-gray-700"
        onClick={updateInputs}
      >
        Update
      </p>
    </div>
  );
};

export default Inputs;
