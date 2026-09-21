import MemoryBox from "./MemoryBox";

/**
 * Renders all positioned stack frames. The supplied order is preserved because
 * calculateLayout has already arranged the backend's frames bottom-to-top.
 *
 * @param {{boxes: Array<Object>}} props Positioned stack boxes.
 * @returns {JSX.Element} SVG group for the stack column.
 */
export default function StackColumn({ boxes = [] }) {
  return (
    <g aria-label="Stack">
      {boxes.map((box) => (
        <MemoryBox
          key={box.key}
          box={box}
          ariaLabel={`Stack frame ${box.title}`}
        />
      ))}
    </g>
  );
}
