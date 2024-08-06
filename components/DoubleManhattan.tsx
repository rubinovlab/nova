import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { Gene } from "@prisma/client";

interface Props {
  genes: Gene[];
  genes2: Gene[];
}

const DoubleManhattan: React.FC<Props> = ({ genes, genes2 }) => {
  const d3Container = useRef<HTMLDivElement | null>(null);

  const margin = { top: 20, right: 5, bottom: 40, left: 40 };
  const width = 500 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  const generateKey = (gene: Gene) =>
    `${gene.geneId}_${gene.phenotype}_${gene.grex}`;

  const geneMap = new Map(genes.map((gene) => [generateKey(gene), gene]));
  const geneMap2 = new Map(genes2.map((gene) => [generateKey(gene), gene]));

  const combinedGeneData1 = genes2.map((gene) => {
    const key = generateKey(gene);
    const foundGene = geneMap.get(key);
    if (foundGene) {
      return {
        geneId: gene.geneId,
        phenotype: gene.phenotype,
        grex: gene.grex,
        p1: foundGene.pValue,
        p2: gene.pValue,
      };
    } else {
      return {
        geneId: gene.geneId,
        phenotype: gene.phenotype,
        grex: gene.grex,
        p1: 0,
        p2: gene.pValue,
      };
    }
  });

  const combinedGeneData2 = genes.map((gene) => {
    const key = generateKey(gene);
    const foundGene = geneMap2.get(key);
    if (foundGene) {
      return {
        geneId: gene.geneId,
        phenotype: gene.phenotype,
        grex: gene.grex,
        p1: foundGene.pValue,
        p2: gene.pValue,
      };
    } else {
      return {
        geneId: gene.geneId,
        phenotype: gene.phenotype,
        grex: gene.grex,
        p2: 0,
        p1: gene.pValue,
      };
    }
  });

  const combinedGeneData = d3.union(combinedGeneData1, combinedGeneData2);

  // transformed p-values
  const transformedPValues1 = genes.map((gene) => -Math.log10(gene.pValue));
  const transformedPValues2 = genes2.map((gene) => -Math.log10(gene.pValue));
  const maxPValue1 = d3.max(transformedPValues1) || 1;
  const maxPValue2 = d3.max(transformedPValues2) || 1;

  // define scales
  const x = d3.scaleLinear().domain([0, maxPValue1]).range([0, width]);
  const y = d3.scaleLinear().domain([0, maxPValue2]).range([height, 0]);

  /* ===
  PLOT DATA POINTS AND DRAW AXES
  === */

  useEffect(() => {
    if (genes.length > 0 && d3Container.current) {
      const container = d3.select(d3Container.current);
      container.selectAll("svg").remove();

      // draw graph
      const svg = d3
        .select(d3Container.current)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      const xAxis = svg
        .append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

      xAxis.selectAll("text").style("font-size", "14px");
      xAxis.selectAll("line").style("stroke-width", "2px");
      xAxis.selectAll("path").style("stroke-width", "2px");

      const yAxis = svg.append("g").call(d3.axisLeft(y));

      yAxis.selectAll("text").style("font-size", "14px");
      yAxis.selectAll("line").style("stroke-width", "2px");
      yAxis.selectAll("path").style("stroke-width", "2px");

      svg
        .selectAll(".dot")
        .data(combinedGeneData)
        .enter()
        .append("circle")
        .attr("z-index", "-1")
        .attr("class", "dot")
        .attr("cx", (d) => x(d.p1 === 0 ? 0 : -Math.log10(d.p1)))
        .attr("cy", (d) => y(d.p2 === 0 ? 0 : -Math.log10(d.p2)))
        .attr("r", 2)
        .style("fill", "green");
    }
  }, [d3Container.current, genes, genes2]);

  return (
    <div ref={d3Container} className="mx-auto">
      {/* <svg width={width} height={height}></svg> */}
    </div>
  );
};

export default DoubleManhattan;
