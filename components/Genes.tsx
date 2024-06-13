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
  return (
    <div className="inline-block">
      <div className="overflow-scroll h-80 flex flex-col gap-1 py-2 pl-2 pr-6">
        {(filter.phenotype === "" && filter.grex === "" ? genes : filteredGenes)
          .filter((gene) => gene.pValue < filter.line)
          .map((gene, index) => (
            <p
              key={index}
              className="px-4 py-2 border rounded-md cursor-pointer hover:shadow-sm hover:scale-105 transition hover:text-gray-800"
              onClick={() => setHighlightedGene(gene)}
            >
              {gene.geneId}
            </p>
          ))}
      </div>
    </div>
  );
};

export default Genes;
