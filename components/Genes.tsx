import { Filter } from "@/utils/types";
import { Gene } from "@prisma/client";

interface Props {
  genes: Gene[];
  filteredGenes: Gene[];
  filter: Filter;
  setHighlightedGene: React.Dispatch<React.SetStateAction<Gene | undefined>>;
}

const Genes: React.FC<Props> = ({
  genes,
  filteredGenes,
  filter,
  setHighlightedGene,
}) => {
  const dataLength = 0;
  // filter.phenotype === "" && filter.grex === ""
  //   ? genes.length
  //   : filteredGenes.length;

  let pValues = genes.map((d) => d.pValue).sort((a, b) => a - b);
  let fdrCutoff = 0;
  for (let i = 0; i < pValues.length; i++) {
    if (pValues[i] <= ((i + 1) / dataLength) * filter.line) {
      fdrCutoff = pValues[i];
    } else {
      break;
    }
  }

  const filterValue = (gene: Gene) => {
    return filter.correction === "bonferroni"
      ? gene.pBonferroni < filter.line
      : filter.correction === "FDR"
      ? gene.pValue < fdrCutoff
      : gene.pValue < filter.line;
  };

  return (
    <div className="inline-block">
      {/* <p>
        {filter.grex !== "" || filter.phenotype !== ""
          ? filteredGenes.filter((gene) => filterValue(gene)).length
          : genes.filter((gene) => filterValue(gene)).length}{" "}
        significant genes.
      </p>

      <div className="overflow-scroll h-80 flex flex-col gap-1 py-2 pl-2 pr-6">
        {(filter.phenotype === "" && filter.grex === "" ? genes : filteredGenes)
          .filter((gene) => filterValue(gene))
          .map((gene, index) => (
            <p
              key={index}
              className="px-4 py-2 border rounded-md cursor-pointer hover:shadow-sm hover:scale-105 transition hover:text-gray-800"
              onClick={() => setHighlightedGene(gene)}
            >
              {gene.geneSymbol}
            </p>
          ))}
      </div> */}
    </div>
  );
};

export default Genes;
