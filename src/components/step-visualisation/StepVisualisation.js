import calculateLayout from "./calculateLayout";
import HeapColumn from "./HeapColumn";
import ReferenceEdges from "./ReferenceEdges";
import StackColumn from "./StackColumn";
import StaticColumn from "./StaticColumn";

/**
 * Converts one annotated debugger step into a declarative SVG visualization.
 * All geometry is calculated before rendering, leaving the child components as
 * simple views of the layout model.
 *
 * @param {{step: Object|null|undefined}} props Current debugger step.
 * @returns {JSX.Element} Responsive stack, heap, and static-memory SVG.
 */
export default function StepVisualisation({ step }) {
  const layout = calculateLayout(step);

  return (
    <svg
      role="img"
      aria-label="Program memory visualization"
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      width="100%"
      height={layout.height}
      preserveAspectRatio="xMinYMax meet"
    >
      <title>Java stack, heap, and static memory</title>
      <StackColumn boxes={layout.stackBoxes} />
      <HeapColumn boxes={layout.heapBoxes} />
      <StaticColumn boxes={layout.staticBoxes} />
      <ReferenceEdges references={layout.references} />
    </svg>
  );
}
