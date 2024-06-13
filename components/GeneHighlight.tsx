import { Filter } from "@/utils/types";
import { Gene } from "@prisma/client";

interface Props {
  highlighedGene: Gene | undefined;
}

const GeneHighlight: React.FC<Props> = ({ highlighedGene }) => {
  return (
    <div className="inline-block border rounded-md p-6">
      {highlighedGene ? (
        <div>
          <p className="text-lg">{highlighedGene.geneId}</p>
          <p>Chromosome: {highlighedGene.chromosome}</p>
          <p>Phenotype: {highlighedGene.phenotype}</p>
          <p>Expression Region: {highlighedGene.grex}</p>
          <p>Start Position: {highlighedGene.startPosition}</p>
          <p>End Position: {highlighedGene.endPosition}</p>
        </div>
      ) : (
        <p>No gene selected</p>
      )}
    </div>
  );
};

export default GeneHighlight;
