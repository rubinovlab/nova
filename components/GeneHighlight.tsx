import { Filter, GrexVol } from "@/utils/types";
import { Gene } from "@prisma/client";
import GrexPlot from "./GrexPlot";

interface Props {
  highlighedGene: Gene | undefined;
  grexVolData: GrexVol;
  filter: Filter;
}

const GeneHighlight: React.FC<Props> = ({
  highlighedGene,
  grexVolData,
  filter,
}) => {
  return (
    <div className="inline-block border-black border rounded-md p-6">
      {highlighedGene ? (
        <div>
          <p className="text-lg text-center">
            <span className="font-semibold">{highlighedGene.geneSymbol}</span>{" "}
            vs
          </p>
          <p className="text-center">
            <span className="font-semibold">{highlighedGene.phenotype}</span>
          </p>
          <p className="text-center mt-4 mb-2">
            effect = {highlighedGene.beta.toFixed(1)}, p &lt; {filter.line}, (
            {grexVolData.grexes.length} samples)
          </p>
          <div className="flex justify-center">
            <GrexPlot
              highlighedGene={highlighedGene}
              grexVolData={grexVolData}
            />
          </div>
          <p className="mt-4">Ensembl ID: {highlighedGene.geneId}</p>
          <p>Chromosome: {highlighedGene.chromosome}</p>
          <p>Phenotype: {highlighedGene.phenotype}</p>
          <p>gr-Expression: {highlighedGene.grex}</p>
          <p>
            Chr. Position: {highlighedGene.startPosition} |{" "}
            {highlighedGene.endPosition}
          </p>
          <p>p-value: {highlighedGene.pValue}</p>
        </div>
      ) : (
        <p>Select a gene in the table for more info.</p>
      )}
    </div>
  );
};

export default GeneHighlight;
