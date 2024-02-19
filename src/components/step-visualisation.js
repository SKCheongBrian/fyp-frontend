import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';

const StepVisualisation = ({ step, methodColorMap }) => {
  const svgRef = useRef(null);

  // Memoize the color scale creation
  const colorScale = useMemo(() => {
    return d3.scaleOrdinal(d3.schemeCategory10);
  }, []);

  useEffect(() => {
    if (!step) return;

    const stackInfo = step.stackInfo;
    const heapInfo = step.heapInfo;
    const staticInfo = step.staticInfo;

    const destY = {};
  
    const svg = d3.select(svgRef.current);

    // Clear existing visualization
    svg.selectAll('*').remove();

    // Visualization Constants
    const width = 800;
    const height = 500;
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Calculate total height needed for all frames
    const totalFrameHeight = stackInfo.stackFrames.length * 120 + margin.bottom;


    // Add a group for the heap visualization
    const heapGroup = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Iterate over heap objects and create visual elements
    let heapY = 0;
    const heapObjectsMap = {}; // Map to store the coordinates of heap objects by their IDs
    Object.values(heapInfo.heapObjects).forEach(object => {
      const heapColor = colorScale(object.className);

      // Add colored box for heap object
      heapGroup.append('rect')
        .attr('x', margin.left + 300)
        .attr('y', margin.top + heapY)
        .attr('width', 200)
        .attr('height', 100)
        .style('fill', heapColor); // Use color directly

      heapGroup.append('text')
        .attr('x', margin.left + 310)
        .attr('y', margin.top + heapY + 20)
        .text(object.className)
        .style('fill', 'white');

      destY[object.id] = margin.top + heapY + 20;

      const fieldsGroup = heapGroup.append('g')
        .attr('transform', `translate(${margin.left + 310}, ${margin.top + heapY + 40})`); // Adjust coordinates to include margin

      fieldsGroup.selectAll('.fields')
        .data(Object.entries(object.fields))
        .enter()
        .append('rect')
        .attr('x', 0)
        .attr('y', (d, i) => i * 20)
        .attr('width', 180)
        .attr('height', 20)
        .style('fill', 'lightgray') // Set color for variables
        .style('stroke', 'black');

      fieldsGroup.selectAll('.fields-names')
        .data(Object.entries(object.fields))
        .enter()
        .append('text')
        .attr('x', 10)
        .attr('y', (d, i) => i * 20 + 14)
        .text(d => `${d[0]}: ${d[1].value ? d[1].value : d[1].id}`)
        .style('fill', 'black'); // Set text color to black


      // Store the coordinates of the heap object by its ID
      heapObjectsMap[object.id] = { x: margin.left + 300, y: margin.top + heapY };

      heapY += 120; // Increment y position for the next object
    });

    // Add a group for the stack visualization
    const stackGroup = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${height - totalFrameHeight})`);

    // Iterate over stack frames and create visual elements
    stackInfo.stackFrames.forEach((frame, i) => {
      const frameGroup = stackGroup.append('g')
        .attr('transform', `translate(0, ${i * 120})`);

      // Generate color for method frame
      const methodColor = colorScale(frame.methodName);

      // Add colored box for method frame
      frameGroup.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', 200)
        .attr('height', 100)
        .style('fill', methodColor); // Use color directly

      // Add text for method name
      frameGroup.append('text')
        .attr('x', 10)
        .attr('y', 20)
        .text(frame.methodName)
        .style('fill', 'white'); // Set text color to white for contrast

      // Add boxes for local variables
      const variablesGroup = frameGroup.append('g')
        .attr('transform', `translate(10, 40)`);

      variablesGroup.selectAll('.variable')
        .data(Object.entries(frame.localVariables))
        .enter()
        .append('rect')
        .attr('x', 0)
        .attr('y', (_, i) => i * 20) // Using the second parameter i as the index
        .attr('width', 180)
        .attr('height', 20)
        .style('fill', 'lightgray') // Set color for variables
        .style('stroke', 'black');

      // Add text for variable names and values
      variablesGroup.selectAll('.variable-name')
        .data(Object.entries(frame.localVariables))
        .enter()
        .append('text')
        .attr('x', 10)
        .attr('y', (_, i) => i * 20 + 14) // Using the second parameter i as the index
        .text(d => `${d[0]}: ${d[1].value ? d[1].value : ""}`)
        .style('fill', 'black'); // Set text color to black

      // Draw curved arrows to heap objects for object references
      variablesGroup.selectAll('.object-reference')
        .data(Object.entries(frame.localVariables))
        .enter()
        // .filter(d => typeof d[1].value === 'undefined') // Filter out non-object references
        .each(function(d, idx) {
          const variableName = d[0];
          const variable = d[1];
          const object = heapInfo.heapObjects[variable.id];

          if (object && typeof d[1].value === 'undefined') {
            const x1 = 80; // Start X position at end of variable name
            const y1 = idx * 20 + 10; // Y position at the center of the variable name
            const x2 = 310; // End X position at corresponding heap object
            const y2 = destY[d[1].id] - height + totalFrameHeight - (i * 120);

            // Calculate control points for the curve
            const cx = (x1 + x2) / 2; // Control point X at the midpoint
            const cy = (y1 + y2) / 2; // Control point Y at the midpoint - creates a straight line
            const cp1x = (x1 + cx) / 2; // Control point 1 X at 1/3 of the way from the start to the midpoint
            const cp1y = y1; // Control point 1 Y at the same level as the start point
            const cp2x = (cx + x2) / 2; // Control point 2 X at 1/3 of the way from the midpoint to the end
            const cp2y = y2; // Control point 2 Y at the same level as the end point

            // Construct the path string
            const path = `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;

            // Add the path element to draw the curved arrow
            variablesGroup.append('path') .attr('d', path)
              .attr('fill', 'none') // Set fill to none
              .attr('stroke', 'black') // Set line color to black
          }
        });
    });

    const staticGroup = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    let staticY = 0;

    Object.entries(staticInfo.staticVariables).forEach(([className, classData]) => {
      const staticVariables = classData.staticVariables;
      const staticColor = colorScale(className);

      staticGroup.append('rect')
        .attr('x', margin.left + 550)
        .attr('y', margin.top + staticY)
        .attr('width', 200)
        .attr('height', 100)
        .style('fill', staticColor);

      // Append text elements to a separate group for proper positioning
      const textGroup = staticGroup.append('g')
        .attr('transform', `translate(${margin.left + 560}, ${margin.top + staticY + 20})`);

      textGroup.append('text')
        .text(className)
        .style('fill', 'white');

      // Render static variables
      staticVariables.forEach((variable, index) => {
        const variableText = `${variable.name}: ${variable.value ? variable.value : variable.id}`;
        textGroup.append('text')
          .text(variableText)
          .attr('x', 0)
          .attr('y', (index + 1) * 20) // Increment y position for each variable
          .style('fill', 'white');
      });

      staticY += 120;
    });


  }, [step]);

  return (
    <svg ref={svgRef} width={800} height={500}></svg>
  );
};

export default StepVisualisation;
