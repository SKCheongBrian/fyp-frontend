import React, { useEffect, useRef } from "react";
import * as d3 from 'd3';

const StackVisualisation = ({ stackFrames }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    const svg = d3.select(svgRef.current);

    // Define the size and position of the visualization
    const width = 400;
    const height = 300;
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    // const innerWidth = width - margin.left - margin.right;
    // const innerHeight = height - margin.top - margin.bottom;

    // Clear the existing visualization
    svg.selectAll('*').remove();

    // Create a group for each stack frame
    const frameGroups = svg
      .selectAll('.frame-group')
      .data(stackFrames)
      .enter()
      .append('g')
      .attr('class', 'frame-group')
      .attr('transform', (d, i) => `translate(${margin.left}, ${margin.top + i * 60})`);

    // Create a box for each variable in each frame
    frameGroups
      .selectAll('.variable-box')
      .data((d) => Object.entries(d.frame))
      .enter()
      .append('rect')
      .attr('class', 'variable-box')
      .attr('x', 10)
      .attr('y', (d, i) => i * 25)
      .attr('width', 80)
      .attr('height', 20)
      .attr('fill', 'steelblue');

    // Add text labels for variable names and values
    frameGroups
      .selectAll('.variable-label')
      .data((d) => Object.entries(d.frame))
      .enter()
      .append('text')
      .attr('class', 'variable-label')
      .attr('x', 20)
      .attr('y', (d, i) => i * 25 + 15)
      .text((d) => `${d[0]}: ${d[1]}`)
      .attr('fill', 'white');
  }, [stackFrames]);

  return (
    <svg ref={svgRef} width="400" height="300"></svg>
  );
};

export default StackVisualisation;
