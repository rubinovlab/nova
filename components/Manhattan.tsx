import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import axios from "axios";

interface Gene {
  id: number;
  chromosome: string;
  startPosition: number;
  endPosition: number;
  geneId: string;
  pValue: number;
  phenotype: string;
  grex: string;
  beta: number;
  geneSymbol: string;
}

const ManhattanPlot: React.FC = () => {
  const d3Container = useRef<HTMLDivElement | null>(null);

  const [genes, setGenes] = useState<Gene[]>([]);

  const fetchData = async () => {
    try {
      const response = await axios.get("/api/fetch");
      setGenes(response.data.data.filter((gene: Gene) => gene.chromosome));
    } catch (error) {
      console.error("Error fetching data: ", error);
    }
  };

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

  function calculateTickPosition(arr: number[]): number[] {
    const averages: number[] = [];
    for (let i = 1; i < arr.length; i++) {
      const average = (arr[i] + arr[i - 1]) / 2;
      averages.push(average);
    }
    return averages;
  }

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (genes.length > 0 && d3Container.current) {
      const container = d3.select(d3Container.current);

      container.selectAll("svg").remove();

      const margin = { top: 20, right: 30, bottom: 40, left: 40 };
      const width = 1460 - margin.left - margin.right;
      const height = 500 - margin.top - margin.bottom;

      // calculate positions

      const maxEndPositionByChromosome = getMaxEndPositions(genes);

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

      //
      //
      //

      //

      // Group genes by chromosome and sort chromosomes numerically

      // Calculate the cumulative gene count for proportional spacing

      // Create a mapping of chromosome to cumulative position
      const chromosomePosition = new Map<string, number>();
      let cumulativeCount = cumulativeGeneCount[0];
      for (const [chromosome, geneArray] of genesByChromosome) {
        chromosomePosition.set(chromosome, cumulativeCount);
        cumulativeCount += geneArray.length;
      }

      console.log(chromosomePosition);

      const totalGenes = cumulativeGeneCount[cumulativeGeneCount.length - 1];

      // Linear scale for x-axis to spread genes proportionally
      const x = d3.scaleLinear().domain([0, totalGenes]).range([0, width]);

      // Transform p-values
      const transformedPValues = genes.map((gene) => -Math.log10(gene.pValue));
      const y = d3
        .scaleLinear()
        .domain([0, d3.max(transformedPValues) || 1])
        .range([height, 0]);

      const svg = d3
        .select(d3Container.current)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // X-axis with chromosome labels
      const xAxis = d3
        .axisBottom(x)
        .tickValues(calculateTickPosition(cumulativeGeneCount))
        .tickFormat((d, i) => chromosomes[i]);

      svg.append("g").attr("transform", `translate(0,${height})`).call(xAxis);

      svg.append("g").call(d3.axisLeft(y));

      const circles = svg
        .selectAll(".dot")
        .data(genes)
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
        .attr("r", 2)
        .style("fill", (d) =>
          Number(d.chromosome) % 2 === 1 ? "purple" : "pink"
        )
        .style("cursor", "pointer")
        .attr("chromosome", (d) => d.chromosome);

      circles
        .on("mouseover", function (_, i) {
          d3.select(this).transition().duration(100).style("opacity", 0.5);
          console.log(this);
        })
        .on("mouseout", function (_, i) {
          d3.select(this).transition().duration(100).style("opacity", 1);
        });
    }
  }, [d3Container.current, genes]);

  return <div ref={d3Container}></div>;
};

export default ManhattanPlot;
