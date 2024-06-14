import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Filter } from "@/utils/types";
import { Gene } from "@prisma/client";

interface Props {
  genes: Gene[];
  filteredGenes: Gene[];
  filter: Filter;
  setFilter: React.Dispatch<React.SetStateAction<Filter>>;
  setPhenotypes: React.Dispatch<React.SetStateAction<string[]>>;
  setGrexes: React.Dispatch<React.SetStateAction<string[]>>;
  highlighedGene: Gene | undefined;
}

const ManhattanPlot: React.FC<Props> = ({
  genes,
  filteredGenes,
  filter,
  setFilter,
  setPhenotypes,
  setGrexes,
  highlighedGene,
}) => {
  const d3Container = useRef<HTMLDivElement | null>(null);
  const [lineY, setLineY] = useState<number | null>(null);
  const [svg, setSvg] =
    useState<d3.Selection<SVGGElement, unknown, null, undefined>>();

  /* ===
  DEFINE AXES AND PROCESS DATA
  === */

  // define sizing of graph

  const margin = { top: 20, right: 30, bottom: 40, left: 40 };
  const width = 1160 - margin.left - margin.right;
  const height = 320 - margin.top - margin.bottom;

  const maxEndPositionByChromosome = getMaxEndPositions(genes);

  // calculate number of genes for each chromosome
  const genesByChromosome = d3
    .groups(genes, (d) => d.chromosome)
    .sort((a, b) => +a[0] - +b[0]);
  const chromosomes = genesByChromosome.map((d) => d[0]);
  const genesCountByChromosome = genesByChromosome.map((d) => d[1].length);
  const cumulativeGeneCount: number[] = [0];
  genesCountByChromosome.reduce((acc, count) => {
    cumulativeGeneCount.push(acc + count);
    return acc + count;
  }, 0);

  // mapping of chromosome to cumulative position
  const chromosomePosition = new Map<string, number>();
  let cumulativeCount = cumulativeGeneCount[0];
  for (const [chromosome, geneArray] of genesByChromosome) {
    chromosomePosition.set(chromosome, cumulativeCount);
    cumulativeCount += geneArray.length;
  }
  const totalGenes = cumulativeGeneCount[cumulativeGeneCount.length - 1];

  // transformed p-values
  const transformedPValues = genes.map((gene) => -Math.log10(gene.pValue));
  const maxPValue = d3.max(transformedPValues) || 1;

  // define scales
  const x = d3.scaleLinear().domain([0, totalGenes]).range([0, width]);
  const y = d3.scaleLinear().domain([0, maxPValue]).range([height, 0]);

  /* ===
  HELPER FUNCTIONS
  === */

  // get the max end position of each chromosome's genes for cx calculation
  function getMaxEndPositions(
    genes: Gene[]
  ): { chromosome: string; maxEndPosition: number }[] {
    const maxEndPositions: { [key: string]: number } = {};

    genes.forEach((gene) => {
      if (
        !maxEndPositions[gene.chromosome] ||
        gene.endPosition > maxEndPositions[gene.chromosome]
      ) {
        maxEndPositions[gene.chromosome] = gene.endPosition;
      }
    });

    return Object.entries(maxEndPositions).map(
      ([chromosome, maxEndPosition]) => ({
        chromosome,
        maxEndPosition,
      })
    );
  }

  // calculate tick position based on number of chromosomes
  function calculateTickPosition(arr: number[]): number[] {
    const averages: number[] = [];
    for (let i = 1; i < arr.length; i++) {
      const average = (arr[i] + arr[i - 1]) / 2;
      averages.push(average);
    }
    return averages;
  }

  /* ===
  DRAW AXES
  === */

  useEffect(() => {
    if (genes.length > 0 && d3Container.current) {
      const container = d3.select(d3Container.current);
      container.selectAll("svg").remove();

      // obtain options for filters
      setPhenotypes(
        d3
          .groups(genes, (d) => d.phenotype)
          .sort()
          .map((d) => d[0])
      );
      setGrexes(
        d3
          .groups(genes, (d) => d.grex)
          .sort()
          .map((d) => d[0])
      );

      // draw graph
      const svg = d3
        .select(d3Container.current)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
      setSvg(svg);

      // x-axis ticks with chromosome labels
      const xTicks = d3
        .axisBottom(x)
        .tickValues(calculateTickPosition(cumulativeGeneCount))
        .tickFormat((d, i) => chromosomes[i]);

      // style x-axis
      const xAxis = svg
        .append("g")
        .attr("transform", `translate(0,${height})`)
        .call(xTicks);
      xAxis.selectAll("text").style("font-size", "14px");
      xAxis.selectAll("line").style("stroke-width", "2px");
      xAxis.selectAll("path").style("stroke-width", "2px");

      // Generate tick values in increments of 8 up to the maximum p-value
      let tickValues = d3.range(0, maxPValue, 8);
      if (maxPValue % 8 !== 0) {
        tickValues.push(maxPValue);
      }

      // style y-axis
      const yAxis = svg.append("g").call(d3.axisLeft(y).tickValues(tickValues));
      yAxis.selectAll("line").style("stroke-width", "2px");
      yAxis.selectAll("path").style("stroke-width", "2px");
      yAxis.selectAll("text").style("font-size", "14px");
    }
  }, [d3Container.current]);

  useEffect(() => {
    if (genes.length > 0 && d3Container.current && svg) {
      const container = d3.select(d3Container.current);
      container.selectAll(".dot").remove();
      container.selectAll("line").remove();

      // draw data points
      svg
        .selectAll(".dot")
        .data(
          filter.phenotype === "" && filter.grex === "" ? genes : filteredGenes
        )
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("cx", (d) => {
          const chromosomeIndex = Number(d.chromosome) - 1;
          return x(
            ((d.startPosition + d.endPosition) /
              2 /
              maxEndPositionByChromosome[chromosomeIndex].maxEndPosition) *
              genesCountByChromosome[chromosomeIndex] +
              cumulativeGeneCount[chromosomeIndex]
          );
        })
        .attr("cy", (d) => y(-Math.log10(d.pValue)))
        .attr("r", (d) => (d == highlighedGene ? 5 : 2))
        .style("fill", (d) =>
          d == highlighedGene
            ? "#a78bfa"
            : d.pValue < filter.line
            ? "#c4b5fd"
            : Number(d.chromosome) % 2 === 1
            ? "#d1d5db"
            : "#9ca3af"
        )
        .attr("pValue", (d) => d.pValue);

      // draw cut off line
      svg
        .append("line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", y(-Math.log10(filter.line)))
        .attr("y2", y(-Math.log10(filter.line)))
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .style("height", "5px")

        .style("cursor", "ns-resize")
        .call(
          d3.drag<SVGLineElement, unknown>().on("drag", (event: any) => {
            const newY = event.y;
            if (Math.pow(10, -y.invert(newY)) <= 1) {
              setLineY(newY);
              const newPValue = Math.pow(10, -y.invert(newY));
              setFilter((prevFilter) => ({ ...prevFilter, line: newPValue }));
            }
          })
        );
    }
  }, [d3Container.current, genes, filter, highlighedGene, lineY]);

  return <div ref={d3Container}></div>;
};

export default ManhattanPlot;
