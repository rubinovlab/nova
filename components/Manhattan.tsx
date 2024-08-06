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
  lineY: number;
  setLineY: React.Dispatch<React.SetStateAction<number>>;
  prevLineY: number;
  setPrevLineY: React.Dispatch<React.SetStateAction<number>>;
  heightParam: number;
  widthParam: number;
  radius: number;
  upsideDown: boolean;
}

const ManhattanPlot: React.FC<Props> = ({
  genes,
  filteredGenes,
  filter,
  setFilter,
  setPhenotypes,
  setGrexes,
  highlighedGene,
  lineY,
  setLineY,
  prevLineY,
  setPrevLineY,
  heightParam,
  widthParam,
  radius,
  upsideDown,
}) => {
  const d3Container = useRef<HTMLDivElement | null>(null);

  const [svg, setSvg] =
    useState<d3.Selection<SVGGElement, unknown, null, undefined>>();
  const [prevFilter, setPrevFilter] = useState<number>(filter.line);
  const [curFilter, setCurFilter] = useState<number>(filter.line);

  /* ===
  DEFINE AXES AND PROCESS DATA
  === */

  // define sizing of graph

  const margin = { top: 20, right: 5, bottom: 40, left: 60 };
  const width = heightParam - margin.left - margin.right;
  const height = widthParam - margin.top - margin.bottom;

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
  const y = d3
    .scaleLinear()
    .domain([0, maxPValue])
    .range(upsideDown ? [0, height] : [height, 0]);

  // list of phenotypes

  const phenotypes = d3
    .groups(genes, (d) => d.phenotype)
    .sort()
    .map((d) => d[0]);

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

  /* ===
  CREATE GRAPH
  === */

  useEffect(() => {
    if (genes.length > 0 && d3Container.current) {
      const container = d3.select(d3Container.current);
      container.selectAll("svg").remove();

      // obtain options for filters
      setPhenotypes(phenotypes);
      setGrexes(
        d3
          .groups(genes, (d) => d.grex)
          .sort()
          .map((d) => d[0])
      );

      setLineY(y(-Math.log10(filter.line)));
      setPrevLineY(y(-Math.log10(filter.line)));

      // draw graph
      const svg = d3
        .select(d3Container.current)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
      setSvg(svg);
    }
  }, [d3Container.current, genes]);

  /* ===
  PLOT DATA POINTS AND DRAW AXES
  === */

  useEffect(() => {
    if (genes.length > 0 && d3Container.current && svg) {
      const container = d3.select(d3Container.current);
      console.log("chungus");

      container.selectAll("line").remove();
      container.selectAll("text").remove();
      container.selectAll("path").remove();

      // draw data points

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

      container
        .selectAll(".dot")
        // .filter(
        //   (d: any) =>
        //     (d.pValue < prevFilter && d.pValue > curFilter) ||
        //     (d.pValue > prevFilter && d.pValue < curFilter)
        // )
        .remove();

      svg
        .selectAll(".dot")
        .data(
          filter.phenotype.length === 0 && filter.grex.length === 0
            ? genes
            : filteredGenes
        )
        .enter()
        .append("circle")
        .attr("z-index", "-1")
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
        .attr("r", (d) => (d == highlighedGene ? 5 : radius))
        .attr("stroke", (d) =>
          d == highlighedGene
            ? hexCodes[phenotypes.indexOf(d.phenotype)]
            : "none"
        )
        .attr("stroke-width", (d) => (d == highlighedGene ? "4" : "0"))
        .attr("opacity", (d) => (d == highlighedGene ? "100%" : "60%"))
        .style("fill", (d) =>
          d == highlighedGene
            ? "transparent"
            : filter.correction === "bonferroni"
            ? d.pValue < filter.line / dataLength
              ? hexCodes[phenotypes.indexOf(d.phenotype)]
              : Number(d.chromosome) % 2 === 1
              ? "#d1d5db"
              : "#9ca3af"
            : filter.correction === "FDR"
            ? d.pValue < fdrCutoff
              ? hexCodes[phenotypes.indexOf(d.phenotype)]
              : Number(d.chromosome) % 2 === 1
              ? "#d1d5db"
              : "#9ca3af"
            : d.pValue < filter.line
            ? hexCodes[phenotypes.indexOf(d.phenotype)]
            : Number(d.chromosome) % 2 === 1
            ? "#d1d5db"
            : "#9ca3af"
        );

      // draw cut off line

      const cufOffHeight =
        filter.correction === "bonferroni"
          ? y(-Math.log10(filter.line / dataLength))
          : filter.correction === "FDR"
          ? y(-Math.log10(fdrCutoff))
          : y(-Math.log10(filter.line));

      svg
        .append("line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", cufOffHeight)
        .attr("y2", cufOffHeight)
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .style("height", "5px");
      // .style("cursor", filter.correction === "FDR" ? "default" : "ns-resize");
      // .call(
      //   d3.drag<SVGLineElement, unknown>().on("drag", (event: any) => {
      //     const newY = event.y;

      //     if (filter.correction === "bonferroni") {
      //       if (Math.pow(10, -y.invert(newY)) <= 1) {
      //         setLineY(newY);
      //         const newPValue = dataLength * Math.pow(10, -y.invert(newY));
      //         setPrevFilter(curFilter);
      //         setCurFilter(newPValue);
      //         setFilter((prevFilter) => ({ ...prevFilter, line: newPValue }));
      //       } else {
      //         setLineY(height);
      //         const newPValue = dataLength * 1;
      //         setFilter((prevFilter) => ({ ...prevFilter, line: newPValue }));
      //       }
      //     }
      //     if (filter.correction === "") {
      //       if (Math.pow(10, -y.invert(newY)) <= 1) {
      //         setLineY(newY);
      //         const newPValue = Math.pow(10, -y.invert(newY));
      //         setPrevFilter(curFilter);
      //         setCurFilter(newPValue);
      //         setFilter((prevFilter) => ({ ...prevFilter, line: newPValue }));
      //       } else {
      //         setLineY(height);
      //         const newPValue = 1;
      //         setFilter((prevFilter) => ({ ...prevFilter, line: newPValue }));
      //       }
      //     }
      //     console.log(prevFilter, curFilter);
      //   })
      // );

      // redraw axes
      // generate tick values based on chromosomes

      const xTicksTop = d3
        .axisTop(x)
        .tickValues(calculateTickPosition(cumulativeGeneCount))
        .tickFormat((d, i) => chromosomes[i]);

      const xTicksBottom = d3
        .axisBottom(x)
        .tickValues(calculateTickPosition(cumulativeGeneCount))
        .tickFormat((d, i) => chromosomes[i]);

      // style x-axis
      const xAxis = svg
        .append("g")
        .attr("transform", upsideDown ? "" : `translate(0,${height})`)
        .call(upsideDown ? xTicksTop : xTicksBottom);
      xAxis.selectAll("text").style("font-size", "14px");
      xAxis.selectAll("line").style("stroke-width", "2px");
      xAxis.selectAll("path").style("stroke-width", "2px");

      if (upsideDown)
        svg
          .append("text")
          .attr("text-anchor", "middle")
          .attr("x", width / 2)
          .attr("y", height + margin.top + 20)
          .text("Chromosome");

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

      svg
        .append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 20)
        .attr("x", -height / 2)
        .text("-log10(p)");
    }
  }, [d3Container.current, genes, filter, highlighedGene, lineY, upsideDown]);

  return (
    <div ref={d3Container} className="mx-auto">
      {/* <svg width={width} height={height}></svg> */}
    </div>
  );
};

export default ManhattanPlot;
