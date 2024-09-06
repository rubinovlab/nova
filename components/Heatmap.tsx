import { Filter } from "@/utils/types";
import { Gene } from "@prisma/client";
import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";

// define prop types
interface Props {
  genes: Gene[];
  filteredGenes: Gene[];
  phenotypes: string[];
  filter: Filter;

  genes2: Gene[];
  filteredGenes2: Gene[];
  phenotypes2: string[];
  filter2: Filter;

  normalize: boolean;
}

// define heatmap data structure
interface HeatmapData {
  xValue: string;
  yValue: string;
  genes: Set<string>;
  jaccardIndex: number;
}

// define type for the highlighted rectangle in heatmap
interface SelectedRect {
  xValue: string;
  yValue: string;
}

const Heatmap: React.FC<Props> = ({
  genes,
  filteredGenes,
  phenotypes,
  filter,
  genes2,
  filteredGenes2,
  phenotypes2,
  filter2,
  normalize,
}) => {
  const d3Container2 = useRef<HTMLDivElement | null>(null);

  // state for tooltip
  // unused
  const [tooltipGenes, setTooltipGenes] = useState<HeatmapData>({
    xValue: "",
    yValue: "",
    genes: new Set(),
    jaccardIndex: 0,
  });

  // state for highlighted rectangle in heatmap
  const [selectedRect, setSelectedRect] = useState<SelectedRect>({
    xValue: "",
    yValue: "",
  });

  // define sizing of graph
  const margin = { top: 0, right: 0, bottom: 100, left: 100 };
  const width =
    45 *
      (filter.phenotype.length > 0
        ? filter.phenotype.length
        : phenotypes.length) -
    margin.right;
  const height =
    45 *
      (filter2.phenotype.length > 0
        ? filter2.phenotype.length
        : phenotypes2.length) -
    margin.top;

  // filtering significant genes
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

  const filterValue = (gene: Gene) => {
    return filter.correction === "bonferroni"
      ? gene.pValue < filter.line / dataLength
      : filter.correction === "FDR"
      ? gene.pValue < fdrCutoff
      : gene.pValue < filter.line;
  };

  const dataLength2 =
    filter2.phenotype.length === 0 && filter2.grex.length === 0
      ? genes2.length
      : filteredGenes2.length;

  let pValues2 = genes2.map((d) => d.pValue).sort((a, b) => a - b);
  let fdrCutoff2 = 0;
  for (let i = 0; i < pValues2.length; i++) {
    if (pValues2[i] <= ((i + 1) / dataLength2) * filter2.line) {
      fdrCutoff2 = pValues2[i];
    } else {
      break;
    }
  }

  const filterValue2 = (gene: Gene) => {
    return filter2.correction === "bonferroni"
      ? gene.pValue < filter2.line / dataLength2
      : filter2.correction === "FDR"
      ? gene.pValue < fdrCutoff2
      : gene.pValue < filter2.line;
  };

  // render graph
  useEffect(() => {
    if (d3Container2.current && phenotypes.length > 0) {
      d3.select(d3Container2.current).selectAll("svg").remove();

      // obtain maps of phenotype to gene
      const genesByPhenotype = d3.groups(
        filter.grex.length !== 0 || filter.phenotype.length !== 0
          ? filteredGenes.filter((gene) => filterValue(gene))
          : genes.filter((gene) => filterValue(gene)),
        (d) => d.phenotype
      );
      const genesByPhenotype2 = d3.groups(
        filter2.grex.length !== 0 || filter2.phenotype.length !== 0
          ? filteredGenes2.filter((gene) => filterValue2(gene))
          : genes2.filter((gene) => filterValue2(gene)),
        (d) => d.phenotype
      );

      // find intersection of phenotypes
      const heatmapData: HeatmapData[] = [];
      for (let i = 0; i < genesByPhenotype.length; i++) {
        for (let j = 0; j < genesByPhenotype2.length; j++) {
          heatmapData.push({
            xValue: genesByPhenotype[i][0],
            yValue: genesByPhenotype2[j][0],
            genes: new Set(
              genesByPhenotype[i][1]
                .filter((gene) =>
                  genesByPhenotype2[j][1].some(
                    (gene2) => gene2.geneId === gene.geneId
                  )
                )
                .map((gene) => gene.geneSymbol)
            ),
            jaccardIndex:
              new Set(
                genesByPhenotype[i][1]
                  .filter((gene) =>
                    genesByPhenotype2[j][1].some(
                      (gene2) => gene2.geneId === gene.geneId
                    )
                  )
                  .map((gene) => gene.geneSymbol)
              ).size /
              Math.min(
                genesByPhenotype[i][1].length,
                genesByPhenotype2[j][1].length
              ),
          });
        }
      }

      const numGenes = heatmapData.map((data) => data.genes.size);

      // define colors of heatmap
      var myColor = d3
        .scaleLinear<string>()
        .range(["white", "red"])
        .domain([0, Math.max(...numGenes)]);

      var myColorJaccard = d3
        .scaleLinear<string>()
        .range(["white", "red"])
        .domain([0, 1]);

      // render graph
      const svg = d3
        .select(d3Container2.current)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // define scales
      const x = d3
        .scaleBand()
        .range([0, width])
        .domain(
          d3.intersection(
            phenotypes,
            genesByPhenotype.map((data) => data[0])
          )
        )
        .padding(0.01);

      const y = d3
        .scaleBand()
        .range([height, 0])
        .domain(
          d3.intersection(
            phenotypes2,
            genesByPhenotype2.map((data) => data[0])
          )
        )
        .padding(0.01);

      const xAxis = svg
        .append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("dx", "-3em")
        .attr("dy", "3em")
        .attr("transform", "rotate(-45)");

      const yAxis = svg.append("g").call(d3.axisLeft(y));

      // unused tooltip
      const tooltip = d3
        .select(d3Container2.current)
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px");

      // render rectangles in heatmap
      const rects = svg
        .selectAll(".rect")
        .data(heatmapData)
        .enter()
        .append("rect")
        .attr("class", "rect")
        .attr("x", (d) => x(d.xValue) || 0)
        .attr("y", (d) => y(d.yValue) || 0)
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .attr("numGenes", (d) => d.genes.size)
        .attr("fill", (d) =>
          normalize ? myColorJaccard(d.jaccardIndex) : myColor(d.genes.size)
        )
        .attr("cursor", "pointer")
        .on("click", function (event, d: HeatmapData) {
          // Determine if the clicked rectangle is already selected
          const isSelected =
            d.xValue === selectedRect.xValue &&
            d.yValue === selectedRect.yValue;

          // Update the tooltip genes
          setTooltipGenes(d);

          // Update the selected rectangle state
          setSelectedRect(
            isSelected
              ? { xValue: "", yValue: "" }
              : { xValue: d.xValue, yValue: d.yValue }
          );

          // Update the stroke of the clicked rectangle
          d3.select(this)
            .attr("stroke", isSelected ? "none" : "black")
            .attr("stroke-width", isSelected ? 0 : 1);
        })
        .on("mouseover", function (event, d: HeatmapData) {
          d3.select(this).attr("stroke", "black").attr("stroke-width", 1);
        })
        .on("mouseleave", function (event, d: HeatmapData) {
          d3.select(this)
            .attr("stroke", (d: any) => {
              return d.xValue === selectedRect.xValue &&
                d.yValue === selectedRect.yValue
                ? "black"
                : "none";
            })
            .attr("stroke-width", (d: any) => {
              return d.xValue === selectedRect.xValue &&
                d.yValue === selectedRect.yValue
                ? 1
                : 0;
            });
        });
    }
  }, [
    d3Container2.current,
    phenotypes,
    phenotypes2,
    filteredGenes,
    filteredGenes2,
    filter,
    filter2,
  ]);

  return (
    <div
      ref={d3Container2}
      className="mx-auto flex flex-row-reverse mt-20 max-h-96 overflow-y-scroll"
    >
      <div className="border border-black rounded-lg p-4 max-h-80 overflow-y-auto ml-4 sticky top-0 right-0 mr-4">
        <p className="font-semibold text-center w-40">{tooltipGenes.xValue}</p>
        <p className="text-center">vs</p>
        <p className="font-semibold text-center mb-4 w-40">
          {tooltipGenes.yValue}
        </p>
        <p className="mb-2">{tooltipGenes.genes.size} overlapping genes:</p>
        {Array.from(tooltipGenes.genes).map((gene) => (
          <p key={gene}>{gene}</p>
        ))}
      </div>
      <div className="flex h-80 sticky top-0 right-0">
        <div className="flex flex-col justify-between mr-2">
          <p>1 -</p>
          <p>0 -</p>
        </div>
        <div className="w-4 bg-gradient-to-b from-red-500 to-white border border-black"></div>
      </div>
      <div className="max-h-80 overflow-y-scroll">
        <svg></svg>
      </div>
    </div>
  );
};

export default Heatmap;
