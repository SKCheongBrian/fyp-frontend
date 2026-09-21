import MemoryBox from "./MemoryBox";

/**
 * Renders the positioned static variables grouped by declaring class.
 *
 * @param {{boxes: Array<Object>}} props Positioned static-class boxes.
 * @returns {JSX.Element} SVG group for the static column.
 */
export default function StaticColumn({ boxes = [] }) {
  return (
    <g aria-label="Static variables">
      {boxes.map((box) => (
        <MemoryBox
          key={box.key}
          box={box}
          ariaLabel={`Static class ${box.title}`}
        />
      ))}
    </g>
  );
}
