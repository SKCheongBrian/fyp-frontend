const EDGE_COLOUR = "#334155";
const SELF_REFERENCE_OFFSET = 60;

/**
 * Creates an SVG cubic Bézier path for one resolved reference.
 *
 * Normal references bend midway between their source and target. A heap field
 * that points to its own object is routed outside the object's right edge so it
 * remains visible instead of crossing the box.
 *
 * @param {Object} reference Positioned reference from calculateLayout.
 * @returns {string} SVG path-data string.
 */
export function createReferencePath(reference) {
  const { source, target, isSelfReference } = reference;

  if (isSelfReference) {
    const loopX = Math.max(source.x, target.x) + SELF_REFERENCE_OFFSET;

    return [
      `M ${source.x} ${source.y}`,
      `C ${loopX} ${source.y},`,
      `${loopX} ${target.y},`,
      `${target.x} ${target.y}`,
    ].join(" ");
  }

  let controlX = source.x + (target.x - source.x) / 2;

  // Give vertically aligned endpoints a visible horizontal curve.
  if (source.x === target.x) {
    controlX += SELF_REFERENCE_OFFSET;
  }

  return [
    `M ${source.x} ${source.y}`,
    `C ${controlX} ${source.y},`,
    `${controlX} ${target.y},`,
    `${target.x} ${target.y}`,
  ].join(" ");
}

/**
 * Renders reference arrows behind the memory boxes.
 *
 * @param {{references: Array<Object>}} props Resolved layout references.
 * @returns {JSX.Element} SVG group containing arrow definitions and paths.
 */
export default function ReferenceEdges({ references = [] }) {
  return (
    <g aria-label="Object references">
      <defs>
        <marker
          data-testid="reference-arrowhead"
          id="reference-arrowhead"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={EDGE_COLOUR} />
        </marker>
      </defs>

      {references.map((reference) => (
        <path
          key={reference.key}
          data-testid="reference-edge"
          data-reference-key={reference.key}
          data-object-id={reference.objectId}
          data-self-reference={String(reference.isSelfReference)}
          d={createReferencePath(reference)}
          fill="none"
          stroke={EDGE_COLOUR}
          strokeWidth="1.5"
          markerEnd="url(#reference-arrowhead)"
        />
      ))}
    </g>
  );
}
