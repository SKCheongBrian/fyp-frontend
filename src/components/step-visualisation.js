import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const StepVisualisation = ({ step }) => {
  const svgRef = useRef(null);
  const [svgHeight, setSvgHeight] = useState(500);

  const boxColour = 'white';
  const variableBoxColour = 'lightgray';
  const textColour = 'black';

  useEffect(() => {
    if (!step) return;

    const stackInfo = step.stackInfo;
    const heapInfo = step.heapInfo;
    const staticInfo = step.staticInfo;

    if (!stackInfo || !heapInfo || !staticInfo) return;

    const svg = d3.select(svgRef.current);

    // Clear existing visualization
    svg.selectAll('*').remove();

    // Visualization Constants
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    // const innerWidth = width - margin.left - margin.right;
    // const innerHeight = height - margin.top - margin.bottom;

    const source_dest_map = [];
    const heap_references = [];

    // Add a group for the heap visualization
    const heapGroup = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);
    // Iterate over heap objects and create visual elements
    let heapY = -25;
    const heapObjectsMap = {}; // Map to store the coordinates of heap objects by their IDs
    Object.values(heapInfo.heapObjects).forEach(object => {
      const numberOfFields = Object.keys(object.fields).length;
      const numberOfSyntheticFields = Object.keys(object.syntheticFields).length;
      const totalNumberOfFields = numberOfSyntheticFields + numberOfFields;
      const boxHeight = 30 + (totalNumberOfFields * 20) + 10;
      heapY -= boxHeight;

      // Add colored box for heap object
      const heapObj = heapGroup.append('rect')
        .attr('x', margin.left + 300)
        .attr('y', heapY)
        .attr('width', 200)
        .attr('height', boxHeight)
        .attr('stroke', 'black')
        .style('fill', boxColour); // Use color directly


      const heapObjBoxX = parseInt(heapObj.attr('x'));
      const heapObjBoxY = parseInt(heapObj.attr('y'));

      heapGroup.append('text')
        .attr('x', margin.left + 310)
        .attr('y', margin.top + heapY)
        .text(object.className)
        .style('fill', textColour);

      const fieldsGroup = heapGroup.append('g')
        .attr('transform', `translate(${margin.left + 310}, ${margin.top + heapY + 10})`); // Adjust coordinates to include margin

      fieldsGroup.selectAll('.fields')
        .data(Object.entries(object.fields))
        .enter()
        .append('rect')
        .attr('x', 0)
        .attr('y', (d, i) => i * 20)
        .attr('width', 180)
        .attr('height', 20)
        .style('fill', variableBoxColour) // Set color for variables
        .style('stroke', 'black');

      fieldsGroup.selectAll('.fields-names')
        .data(Object.entries(object.fields))
        .enter()
        .append('text')
        .attr('x', 10)
        .attr('y', (d, i) => i * 20 + 14)
        .text(d => `${d[0]}: ${d[1].value ? d[1].value : ""}`)
        .style('fill', textColour); // Set text color to black

      fieldsGroup.selectAll('.object-reference')
        .data(Object.entries(object.fields))
        .enter()
        .each(function(d, idx) {
          const variable = d[1];

          if (typeof variable.value === "undefined") {
            const x1 = heapObjBoxX + 80;
            const y1 = heapObjBoxY + (idx * 20 + 15) + 45;
            heap_references.push({ id: variable.id, x: x1, y: y1 });
          }
        });

      // Adding synthetic fields below regular fields
      fieldsGroup.selectAll('.synthetic-fields')
        .data(Object.entries(object.syntheticFields))
        .enter()
        .append('rect')
        .attr('x', 0)
        .attr('y', (d, i) => i * 20 + (numberOfFields * 20) + 5) // Placing synthetic fields below regular fields
        .attr('width', 180)
        .attr('height', 20)
        .style('fill', 'white') // Set color for synthetic fields
        .style('stroke', 'black');

      fieldsGroup.selectAll('.synthetic-fields-names')
        .data(Object.entries(object.syntheticFields)) // Assuming syntheticFields is an array containing the synthetic fields
        .enter()
        .append('text')
        .attr('x', 10)
        .attr('y', (d, i) => i * 20 + (numberOfFields * 20) + 5 + 14) // Placing synthetic fields below regular fields
        .text(d => `${d[0]}: ${d[1].value ? d[1].value : ""}`)
        .style('fill', textColour); // Set text color to black

      fieldsGroup.selectAll('.object-reference')
        .data(Object.entries(object.syntheticFields))
        .enter()
        .each(function(d, idx) {
          const variable = d[1];

          if (typeof variable.value === "undefined") {
            const x1 = heapObjBoxX + 80;
            const y1 = heapObjBoxY + (numberOfFields * 20 + 5) + (idx * 20 + 15) + 45;
            heap_references.push({ id: variable.id, x: x1, y: y1 });
          }
        });

      // Store the coordinates of the heap object by its ID
      heapObjectsMap[object.id] = { x: parseInt(heapObj.attr('x')), y: parseInt(heapObj.attr('y')) };

      heapY -= 10; // Increment y position for the next object
    });

    console.log("heapObjectsMap", heapObjectsMap);
    let stackY = -25;
    // Add a group for the stack visualization
    const stackGroup = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);
    // Iterate over stack frames and create visual elements
    stackInfo.stackFrames.forEach((frame, i) => {

      const numberOfVariables = Object.keys(frame.localVariables).length;
      const boxHeight = 30 + (numberOfVariables * 20) + 10;
      stackY -= boxHeight;

      const frameBox = stackGroup.append('rect')
        .attr('x', 0)
        .attr('y', stackY)
        .attr('width', 200)
        .attr('height', boxHeight)
        .attr('stroke', 'black')
        .style('fill', boxColour);

      const frameBoxX = parseInt(frameBox.attr('x'));
      const frameBoxY = parseInt(frameBox.attr('y'));

      // Add text for method name
      stackGroup.append('text')
        .attr('x', 10)
        .attr('y', margin.top + stackY)
        .text(frame.methodName)
        .style('fill', textColour); // Set text color to white for contrast

      // Add boxes for local variables
      const variablesGroup = stackGroup.append('g')
        .attr('transform', `translate(${10}, ${margin.top + stackY + 10})`); // Adjust coordinates to include margin

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
        .attr('x', 10).attr('y', (_, i) => i * 20 + 14) // Using the second parameter i as the index .text(d => `${d[0]}: ${d[1].value ? d[1].value : ""}`)
        .text(d => `${d[0]}: ${d[1].value ? d[1].value : ""}`)
        .style('fill', textColour); // Set text color to black

      // Draw curved arrows to heap objects for object references
      variablesGroup.selectAll('.object-reference')
        .data(Object.entries(frame.localVariables))
        .enter()
        .each(function(d, idx) {
          const variableName = d[0];
          const variable = d[1];
          const object = heapInfo.heapObjects[variable.id];

          if (object && typeof d[1].value === 'undefined') {
            const x1 = frameBoxX + 210; // Start X position at end of variable name
            const y1 = frameBoxY + (idx * 20 + 15) + 45; // Y position at the center of the variable name
            const x2 = heapObjectsMap[d[1].id].x + 20;
            const y2 = heapObjectsMap[d[1].id].y + 30;
            const xm1 = (0.5 * (x2 - x1)) + x1;
            const ym1 = y1;
            const xm2 = (0.5 * (x2 - x1)) + x1;
            const ym2 = y2;
            source_dest_map.push([{ x: x1, y: y1 }, { x: xm1, y: ym1 }, { x: xm2, y: ym2 }, { x: x2, y: y2 }]);
          }
        });
      stackY -= 10;
    });

    const staticGroup = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    let staticY = -25;

    Object.entries(staticInfo.staticVariables).forEach(([className, classData]) => {
      const staticVariables = classData.staticVariables;
      const numberOfStaticVariables = staticVariables.length;
      const boxHeight = 30 + (numberOfStaticVariables * 20) + 10;
      staticY -= boxHeight;

      const staticBox = staticGroup.append('rect')
        .attr('x', margin.left + 620)
        .attr('y', staticY)
        .attr('width', 200)
        .attr('height', boxHeight)
        .style('fill', boxColour)
        .attr('stroke', 'black')
        .style('fill', boxColour); // Use color directly

      const staticBoxX = parseInt(staticBox.attr('x'));
      const staticBoxY = parseInt(staticBox.attr('y'));

      staticGroup.append('text')
        .attr('x', margin.left + 630)
        .attr('y', margin.top + staticY)
        .text(className)
        .style('fill', textColour);

      const staticVarGroup = staticGroup.append('g')
        .attr('transform', `translate(${margin.left + 630}, ${margin.top + staticY + 10})`);

      staticVarGroup.selectAll('.static-boxes')
        .data(staticVariables)
        .enter()
        .append('rect')
        .attr('x', 0)
        .attr('y', (d, i) => i * 20)
        .attr('width', 180)
        .attr('height', 20)
        .style('fill', variableBoxColour) // Set color for variables
        .style('stroke', 'black');

      staticVarGroup.selectAll('.static-names')
        .data(staticVariables)
        .enter()
        .append('text')
        .attr('x', 10)
        .attr('y', (d, i) => i * 20 + 14)
        .text(d => `${d.name}${d.value ? ": " + d.value : ""}`)
        .style('fill', textColour); // Set text color to black

      staticVarGroup.selectAll('.object-reference')
        .data(staticVariables)
        .enter()
        .each(function(variable, idx) {
          const object = heapInfo.heapObjects[variable.id];

          if (object && variable.id) {
            console.log(variable.name)
            const x1 = staticBoxX + 30; // Start X position at end of variable name
            const y1 = staticBoxY + (idx * 20 + 15) + 45; // Y position at the center of the variable name
            const x2 = heapObjectsMap[variable.id].x + 220;
            const y2 = heapObjectsMap[variable.id].y + 30;
            const xm1 = (0.5 * (x2 - x1)) + x1;
            const ym1 = y1;
            const xm2 = (0.5 * (x2 - x1)) + x1;
            const ym2 = y2;
            console.log([{ x: x1, y: y1 }, { x: xm1, y: ym1 }, { x: xm2, y: ym2 }, { x: x2, y: y2 }])
            source_dest_map.push([{ x: x1, y: y1 }, { x: xm1, y: ym1 }, { x: xm2, y: ym2 }, { x: x2, y: y2 }]);
          }
        });

      staticY -= 10;
    });

    for (let i = 0; i < heap_references.length; i++) {
      const reference = heap_references[i];
      const id = reference.id;
      const x1 = reference.x + 130;
      const y1 = reference.y;
      console.log('id', id);
      console.log('heapObjectsMap', heapObjectsMap);
      console.log('heapReferences', heap_references);
      const x2 = heapObjectsMap[id].x + 220;
      const y2 = heapObjectsMap[id].y + 30;
      const xm1 = 50 + x1;
      const ym1 = (0.2 * (y2 - y1)) + y1;
      const xm2 = 50 + x1;
      const ym2 = (0.8 * (y2 - y1)) + y1;
      source_dest_map.push([{ x: x1, y: y1 }, { x: xm1, y: ym1 }, { x: xm2, y: ym2 }, { x: x2, y: y2 }]);
    }

    const line = d3.line()
      .x(d => d.x)
      .y(d => d.y)
      .curve(d3.curveBasis);
    for (let i = 0; i < source_dest_map.length; i++) {
      const curr = source_dest_map[i];
      svg.append("path")
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 1.5)
        .attr("d", line(curr));
    }

    const currHeight = svg.node().getBBox().height;
    if (currHeight > 500) {
      setSvgHeight(currHeight);
    } else {
      setSvgHeight(500);
    }

    console.log('heapgroup.y', heapGroup.node().getBBox().height);

    console.log("SVG height:", currHeight);
  }, [step]);

  return (
      <svg ref={svgRef} viewBox={`0 -500 900 500`} width={800} height={svgHeight}></svg>
  );
};

export default StepVisualisation;
