import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import axios from "axios";
import { Filter } from "@/utils/types";
import { Gene } from "@prisma/client";

interface Props {
  genes: Gene[];
  filteredGenes: Gene[];
  filter: Filter;
  setPhenotypes: React.Dispatch<React.SetStateAction<string[]>>;
  setGrexes: React.Dispatch<React.SetStateAction<string[]>>;
  highlighedGene: Gene | undefined;
}

const ManhattanPlot: React.FC<Props> = ({
  genes,
  filteredGenes,
  filter,
  setPhenotypes,
  setGrexes,
  highlighedGene,
}) => {
  const d3Container = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    if (genes.length > 0 && d3Container.current) {
      const container = d3.select(d3Container.current);

      container.selectAll("svg").remove();

      const margin = { top: 20, right: 30, bottom: 40, left: 40 };
      const width = 1160 - margin.left - margin.right;
      const height = 320 - margin.top - margin.bottom;

      const maxEndPositionByChromosome = getMaxEndPositions(genes);

      // calculate number of genes for each chromosome
      const genesByChromosome = d3
        .groups(genes, (d) => d.chromosome)
        .sort((a, b) => +a[0] - +b[0]);
      const chromosomes = genesByChromosome.map((d) => d[0]);

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

      // x axis scale by gene count
      const x = d3.scaleLinear().domain([0, totalGenes]).range([0, width]);

      // transformed p-values

      const transformedPValues = genes.map((gene) => -Math.log10(gene.pValue));
      const maxPValue = d3.max(transformedPValues) || 1;
      const y = d3.scaleLinear().domain([0, maxPValue]).range([height, 0]);

      // Generate tick values in increments of 8 up to the maximum p-value

      let tickValues = d3.range(0, maxPValue, 8);
      if (maxPValue % 8 !== 0) {
        tickValues.push(maxPValue);
      }

      const svg = d3
        .select(d3Container.current)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

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

      // style y-axis
      const yAxis = svg.append("g").call(d3.axisLeft(y).tickValues(tickValues));
      yAxis.selectAll("line").style("stroke-width", "2px");
      yAxis.selectAll("path").style("stroke-width", "2px");
      yAxis.selectAll("text").style("font-size", "14px");

      const circles = svg
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
        .style("cursor", "pointer")
        .attr("chromosome", (d) => d.chromosome);

      // draw cut off line
      svg
        .append("line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", y(-Math.log10(filter.line)))
        .attr("y2", y(-Math.log10(filter.line)))
        .attr("stroke", "black")
        .attr("stroke-width", 1);

      // circles
      //   .on("mouseover", function (_, i) {
      //     d3.select(this).transition().duration(100).style("opacity", 0.5);
      //     console.log(this);
      //   })
      //   .on("mouseout", function (_, i) {
      //     d3.select(this).transition().duration(100).style("opacity", 1);
      //   });
    }
  }, [d3Container.current, genes, filteredGenes, filter.line, highlighedGene]);

  return <div ref={d3Container}></div>;
};

export default ManhattanPlot;
