import MemoryBox from "./MemoryBox";

/**
 * Renders positioned heap objects, including regular and synthetic fields.
 * Synthetic-row styling is handled by MemoryBox using each row's kind.
 *
 * @param {{boxes: Array<Object>}} props Positioned heap boxes.
 * @returns {JSX.Element} SVG group for the heap column.
 */
export default function HeapColumn({ boxes = [] }) {
  return (
    <g aria-label="Heap">
      {boxes.map((box) => (
        <MemoryBox
          key={box.key}
          box={box}
          ariaLabel={`Heap object ${box.title}, ID ${box.objectId}`}
        />
      ))}
    </g>
  );
}
