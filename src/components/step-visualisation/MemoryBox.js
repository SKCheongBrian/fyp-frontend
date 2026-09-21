import { BOX, CHANGE_COLOURS } from "./constants";
import { getVariableLabel } from "./variableUtils";

const BOX_FILL = "#ffffff";
const BOX_STROKE = "#333333";
const TEXT_COLOUR = "#1f2933";

/**
 * Chooses the row colour from the three-state change value. The boolean flag
 * is retained as a fallback for callers that only provide changed/unchanged.
 *
 * @param {Object} variable Annotated debugger variable.
 * @returns {string} SVG fill colour.
 */
function getRowColour(variable) {
  if (CHANGE_COLOURS[variable?.change]) {
    return CHANGE_COLOURS[variable.change];
  }

  return variable?.isChanged
    ? CHANGE_COLOURS.modified
    : CHANGE_COLOURS.unchanged;
}

/**
 * Renders one positioned stack frame, heap object, or static class box.
 * Layout is supplied by calculateLayout; this component performs no coordinate
 * calculations beyond placing text within already-positioned rectangles.
 *
 * @param {{box: Object, ariaLabel: string}} props Component properties.
 * @returns {JSX.Element} SVG group containing the box and its rows.
 */
export default function MemoryBox({ box, ariaLabel }) {
  return (
    <g
      role="group"
      aria-label={ariaLabel}
      data-box-key={box.key}
      data-box-kind={box.kind}
    >
      <rect
        x={box.x}
        y={box.y}
        width={box.width}
        height={box.height}
        fill={BOX_FILL}
        stroke={BOX_STROKE}
      />

      <text
        x={box.x + BOX.horizontalPadding}
        y={box.y + BOX.headerHeight / 2}
        dominantBaseline="middle"
        fill={TEXT_COLOUR}
        fontWeight="600"
      >
        {box.title}
      </text>

      {box.rows.map((row) => {
        const isSynthetic = row.kind === "synthetic";

        return (
          <g
            key={`${row.kind ?? "variable"}-${row.key}`}
            data-testid={`variable-row-${row.key}`}
            data-row-key={row.key}
            data-change={row.variable.change ?? "unchanged"}
            data-is-changed={String(Boolean(row.variable.isChanged))}
          >
            <rect
              data-testid="variable-row-background"
              x={row.x}
              y={row.y}
              width={row.width}
              height={row.height}
              fill={getRowColour(row.variable)}
              stroke={BOX_STROKE}
              strokeDasharray={isSynthetic ? "4 2" : undefined}
            />
            <text
              x={row.x + BOX.horizontalPadding}
              y={row.y + row.height / 2}
              dominantBaseline="middle"
              fill={TEXT_COLOUR}
              fontSize="13"
              fontStyle={isSynthetic ? "italic" : undefined}
            >
              {getVariableLabel(row.variable)}
            </text>
          </g>
        );
      })}
    </g>
  );
}

export { getRowColour };
