import { Filter } from "@/utils/types";
import { Gene } from "@prisma/client";

interface Props {
  genes: Gene[];
  filteredGenes: Gene[];
  filter: Filter;
  highlightedGene: Gene | undefined;
  setHighlightedGene: React.Dispatch<React.SetStateAction<Gene | undefined>>;
}

const Genes: React.FC<Props> = ({
  genes,
  filteredGenes,
  filter,
  highlightedGene,
  setHighlightedGene,
}) => {
  // obtain p values from genes
  const dataLength =
    filter.phenotype.length === 0 && filter.grex.length === 0
      ? genes.length
      : filteredGenes.length;

  let pValues = genes.map((d) => d.pValue).sort((a, b) => a - b);
  let fdrCutoff = 0;
  for (let i = 0; i < pValues.length; i++) {
    if (pValues[i] <= ((i + 1) / dataLength) * filter.line) {
      fdrCutoff = pValues[i];
    } else {
      break;
    }
  }

  // function to round scientific notation
  function roundToScientificNotation(
    value: number,
    decimalPlaces: number
  ): string {
    // Convert the number to scientific notation string
    let [mantissa, exponent] = value.toExponential().split("e");

    // Convert the mantissa to a number and round it to the specified decimal places
    mantissa = Number(mantissa).toFixed(decimalPlaces);

    // Reconstruct the scientific notation string
    return `${mantissa}e${exponent}`;
  }

  // function to correct pvalue
  const filterValue = (gene: Gene) => {
    return filter.correction === "bonferroni"
      ? gene.pValue < filter.line / dataLength
      : filter.correction === "FDR"
      ? gene.pValue < fdrCutoff
      : gene.pValue < filter.line;
  };

  return (
    <div className="inline-block">
      <div>
        <p className="text-right mb-2">
          {filter.grex.length !== 0 || filter.phenotype.length !== 0
            ? filteredGenes.filter((gene) => filterValue(gene)).length
            : genes.filter((gene) => filterValue(gene)).length}{" "}
          significant genes.
        </p>
      </div>

      <div className="max-h-80 overflow-y-auto">
        <table className="border w-full">
          <thead className="sticky top-0 bg-black text-white">
            <tr className="border text-left">
              <th className="py-1 px-2 font-normal">Chr.</th>
              <th className="py-1 px-2 font-normal">
                Gene Symbol (Ensembl ID)
              </th>
              <th className="py-1 px-2 font-normal">Phenotype</th>
              <th className="py-1 px-2 font-normal">Tissue</th>
              <th className="py-1 px-2 font-normal">gr-Expression</th>
              <th className="py-1 px-2 font-normal">p-value</th>
            </tr>
          </thead>
          <tbody>
            {(filter.phenotype.length === 0 && filter.grex.length === 0
              ? genes
              : filteredGenes
            )
              .filter((gene) => filterValue(gene))
              .sort((a, b) => a.pValue - b.pValue)
              .map((gene, index) => (
                <tr
                  key={index}
                  onClick={() => setHighlightedGene(gene)}
                  className={`cursor-pointer hover:bg-gray-200 transition ${
                    highlightedGene?.geneId === gene.geneId &&
                    highlightedGene?.phenotype === gene.phenotype &&
                    highlightedGene?.grex === gene.grex
                      ? "bg-gray-200"
                      : ""
                  }`}
                >
                  <td className="px-2 py-1">{gene.chromosome}</td>
                  <td className="px-2 py-1">
                    {gene.geneSymbol} ({gene.geneId})
                  </td>
                  <td className="px-2 py-1">{gene.phenotype}</td>
                  <td className="px-2 py-1">JTI</td>
                  <td className="px-2 py-1">{gene.grex}</td>
                  <td className="px-2 py-1">
                    {roundToScientificNotation(gene.pValue, 1)}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Genes;
