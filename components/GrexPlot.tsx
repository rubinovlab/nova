import { GrexVol } from "@/utils/types";
import { Gene } from "@prisma/client";
import * as d3 from "d3";
import { useEffect, useRef } from "react";

// define prop types
interface Props {
  highlighedGene: Gene | undefined;
  grexVolData: GrexVol;
}

// define data structure for graph to allow iteration
interface GrexVolIterable {
  grex: number;
  volume: number;
}

const GrexPlot: React.FC<Props> = ({ highlighedGene, grexVolData }) => {
  const grexVolIterable: GrexVolIterable[] = [];
  for (let i = 0; i < grexVolData.grexes.length; i++) {
    grexVolIterable.push({
      grex: grexVolData.grexes[i],
      volume: grexVolData.volumes[i],
    });
  }
  const d3Container2 = useRef<HTMLDivElement | null>(null);

  // define sizing of graph
  const margin = { top: 0, right: 50, bottom: 30, left: 50 };
  const width = 250 - margin.left - margin.right;
  const height = 200 - margin.top - margin.bottom;

  // define scales
  const x = d3
    .scaleLinear()
    .domain([d3.min(grexVolData.grexes) || 0, d3.max(grexVolData.grexes) || 0])
    .range([0, width]);
  const y = d3
    .scaleLinear()
    .domain([
      d3.min(grexVolData.volumes) || 0,
      d3.max(grexVolData.volumes) || 0,
    ])
    .range([height, 0]);

  //render graph
  useEffect(() => {
    if (d3Container2.current) {
      d3.select(d3Container2.current).selectAll("svg").remove();
    }

    // render graph
    const svg = d3
      .select(d3Container2.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // define axes
    const xAxis = svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));

    const yAxis = svg.append("g").call(d3.axisLeft(y));

    // draw data points
    svg
      .selectAll(".dot")
      .data(grexVolIterable)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", (d) => x(d.grex))
      .attr("cy", (d) => y(d.volume))
      .attr("r", 2)
      .attr("opacity", "30%")
      .attr("fill", "black");

    // Calculate R^2 value manually
    const n = grexVolIterable.length;
    const meanGrex = d3.mean(grexVolIterable, (d) => d.grex) || 0;
    const meanVolume = d3.mean(grexVolIterable, (d) => d.volume) || 0;

    // Calculate slope (b1) and intercept (b0)
    let numerator = 0;
    let denominator = 0;
    grexVolIterable.forEach((d) => {
      numerator += (d.grex - meanGrex) * (d.volume - meanVolume);
      denominator += (d.grex - meanGrex) ** 2;
    });

    const b1 = numerator / denominator;
    const b0 = meanVolume - b1 * meanGrex;

    // Calculate predicted volumes and R^2
    const sst = d3.sum(grexVolIterable, (d) => (d.volume - meanVolume) ** 2);
    const sse = d3.sum(
      grexVolIterable,
      (d) => (d.volume - (b0 + b1 * d.grex)) ** 2
    );

    // r^2 would be stored here below
    // setR2(1 - sse / sst);
  }, [d3Container2.current, highlighedGene, grexVolData]);

  return (
    <div ref={d3Container2} className="mx-auto">
      <svg width={width} height={height}></svg>
    </div>
  );
};

export default GrexPlot;
