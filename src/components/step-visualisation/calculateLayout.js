import {
  BOX,
  COLUMN_TOP,
  COLUMN_X,
  MIN_SVG_HEIGHT,
  SVG_WIDTH,
} from "./constants";
import { isReference } from "./variableUtils";

/**
 * Calculates the height of a visualization box from its number of rows.
 *
 * @param {number} rowCount Number of variable rows in the box.
 * @returns {number} Total box height in SVG units.
 */
function calculateBoxHeight(rowCount) {
  return (
    BOX.headerHeight +
    rowCount * BOX.rowHeight +
    BOX.bottomPadding
  );
}

/**
 * Converts named variables into the common row model used by every column.
 *
 * The entry key is retained as the stable row key. It is also used as the
 * displayed variable name when the backend variable does not provide one.
 * Coordinates are intentionally omitted here and added later by positionBox.
 *
 * @param {Array<[string, Object]>} entries Pairs of row keys and variables.
 * @returns {Array<Object>} Unpositioned layout rows.
 */
function createRows(entries) {
  return entries.map(([key, variable], index) => ({
    key,
    variable: {
      ...variable,
      name: variable.name ?? key,
    },
    index,
  }));
}

/**
 * Sorts map entries by their serialized key.
 *
 * Heap objects, fields, and static classes originate in Java HashMaps, whose
 * iteration order is not part of the backend contract. Sorting them prevents
 * boxes and rows from jumping between otherwise similar execution steps.
 * Numeric object IDs are compared numerically where possible.
 *
 * @param {[string, Object]} left First map entry.
 * @param {[string, Object]} right Second map entry.
 * @returns {number} Standard ascending sort result.
 */
function compareEntriesByKey([left], [right]) {
  return left.localeCompare(right, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

/**
 * Adds absolute SVG coordinates to a box and each of its rows.
 *
 * Rows are placed below the box header with equal horizontal padding. This
 * function does not mutate the supplied box, allowing layout calculation to
 * remain deterministic and straightforward to test.
 *
 * @param {Object} box Unpositioned box description.
 * @param {number} x Horizontal position of the box.
 * @param {number} y Vertical position of the box.
 * @returns {Object} A new box containing positioned rows.
 */
function positionBox(box, x, y) {
  const rowWidth = BOX.width - 2 * BOX.horizontalPadding;

  return {
    ...box,
    x,
    y,
    width: BOX.width,
    rows: box.rows.map((row, index) => ({
      ...row,
      x: x + BOX.horizontalPadding,
      y: y + BOX.headerHeight + index * BOX.rowHeight,
      width: rowWidth,
      height: BOX.rowHeight,
    })),
  };
}

/** Returns the combined box heights and gaps in an unpositioned column. */
function getColumnHeight(boxes) {
  return boxes.reduce(
    (height, box, index) =>
      height +
      box.height +
      (index === boxes.length - 1 ? 0 : BOX.gap),
    0
  );
}

/**
 * Positions boxes bottom-up from a shared baseline. The first backend frame
 * stays at the bottom; later frames sit above it with a consistent gap.
 *
 * @param {Array<Object>} boxes Unpositioned boxes in backend order.
 * @param {number} x Horizontal position shared by the column's boxes.
 * @param {number} baseline Bottom edge shared by all columns.
 * @returns {{boxes: Array<Object>, height: number}} Positioned column.
 */
function layoutColumn(boxes, x, baseline) {
  let cursor = baseline;

  const positionedBoxes = boxes.map((box) => {
    cursor -= box.height;

    const positionedBox = positionBox(box, x, cursor);
    cursor -= BOX.gap;

    return positionedBox;
  });

  return {
    boxes: positionedBoxes,
    height: getColumnHeight(boxes),
  };
}

/**
 * Builds unpositioned boxes for the current call stack.
 *
 * Each stack frame becomes one box and each local variable becomes one row.
 * The backend emits frames bottom-to-top. Its frameIndex is measured from the
 * top and therefore changes when a call is pushed or popped, so the stable
 * bottom-up array position is used in the key instead.
 *
 * @param {Object} step Debugger state for one execution step.
 * @returns {Array<Object>} Unpositioned stack-frame boxes.
 */
function createStackBoxes(step) {
  return (step.stackInfo?.stackFrames ?? []).map((frame, index) => {
    const rows = createRows(
      (frame.localVariables ?? []).map((variable) => [
        variable.name,
        variable,
      ])
    );

    return {
      key: `stack-${index}-${frame.methodName}`,
      frameIndex: frame.frameIndex,
      title: frame.methodName,
      kind: "stack",
      rows,
      height: calculateBoxHeight(rows.length),
    };
  });
}

/**
 * Builds unpositioned boxes for all heap objects in an execution step.
 *
 * Regular fields and compiler-generated synthetic fields share the same row
 * layout. Their kind is retained so HeapColumn can style them differently
 * without needing to understand the original backend structure.
 *
 * @param {Object} step Debugger state for one execution step.
 * @returns {Array<Object>} Unpositioned heap-object boxes.
 */
function createHeapBoxes(step) {
  return Object.entries(step.heapInfo?.heapObjects ?? {})
    .sort(compareEntriesByKey)
    .map(([objectId, object]) => {
      const fieldRows = createRows(
        Object.entries(object.fields ?? {}).sort(compareEntriesByKey)
      ).map((row) => ({
        ...row,
        kind: "field",
      }));

      const syntheticRows = createRows(
        Object.entries(object.syntheticFields ?? {}).sort(compareEntriesByKey)
      ).map((row) => ({
        ...row,
        kind: "synthetic",
      }));

      const rows = [...fieldRows, ...syntheticRows];

      return {
        key: `heap-${objectId}`,
        objectId: String(object.id ?? objectId),
        title: object.className,
        kind: "heap",
        rows,
        height: calculateBoxHeight(rows.length),
      };
    });
}

/**
 * Builds unpositioned boxes for class-level static variables.
 *
 * Each class becomes one box containing a row for each of its static
 * variables. Missing static information is treated as an empty collection.
 *
 * @param {Object} step Debugger state for one execution step.
 * @returns {Array<Object>} Unpositioned static-variable boxes.
 */
function createStaticBoxes(step) {
  return Object.entries(step.staticInfo?.staticVariables ?? {})
    .sort(compareEntriesByKey)
    .map(([className, classData]) => {
      const rows = createRows(
        (classData.staticVariables ?? [])
          .map((variable) => [variable.name, variable])
          .sort(compareEntriesByKey)
      );

      return {
        key: `static-${className}`,
        title: className,
        kind: "static",
        rows,
        height: calculateBoxHeight(rows.length),
      };
    });
}

/**
 * Creates lookup points on both sides of every positioned heap object.
 *
 * Reference edges attach to these points instead of recalculating heap-box
 * geometry. Object IDs are normalized to strings because JavaScript object
 * keys are strings even when the backend supplies numeric IDs.
 *
 * @param {Array<Object>} heapBoxes Positioned heap-object boxes.
 * @returns {Object<string, Object>} Object IDs mapped to their edge anchors.
 */
function getObjectAnchors(heapBoxes) {
  return Object.fromEntries(
    heapBoxes.map((box) => [
      box.objectId,
      {
        left: {
          x: box.x,
          y: box.y + BOX.headerHeight / 2,
        },
        right: {
          x: box.x + box.width,
          y: box.y + BOX.headerHeight / 2,
        },
        centreX: box.x + box.width / 2,
      },
    ])
  );
}

/**
 * Resolves reference-valued rows into source and destination coordinates.
 *
 * An edge leaves the side of its row nearest the target heap object and ends
 * at the corresponding side of the target. References whose target object is
 * absent from the current step are ignored so partial debugger data cannot
 * crash the visualization.
 *
 * @param {Array<Object>} boxes All positioned boxes that may contain sources.
 * @param {Object<string, Object>} objectAnchors Heap anchors indexed by ID.
 * @returns {Array<Object>} Resolved reference-edge descriptions.
 */
function createReferences(boxes, objectAnchors) {
  return boxes.flatMap((box) =>
    box.rows.flatMap((row) => {
      if (!isReference(row.variable)) {
        return [];
      }

      const objectId = String(row.variable.id);
      const targetObject = objectAnchors[objectId];

      if (!targetObject) {
        return [];
      }

      const isSelfReference =
        box.kind === "heap" && box.objectId === objectId;
      const routeOutside = box.kind === "heap";
      const rowCentreX = row.x + row.width / 2;
      const sourceIsLeftOfTarget =
        !routeOutside && rowCentreX < targetObject.centreX;

      const source = {
        x:
          sourceIsLeftOfTarget || routeOutside
            ? row.x + row.width
            : row.x,
        y: row.y + row.height / 2,
      };

      const target =
        sourceIsLeftOfTarget && !isSelfReference
          ? targetObject.left
          : targetObject.right;

      return [
        {
          key: `${box.key}-${row.kind ?? "variable"}-${row.key}-${objectId}`,
          objectId,
          source,
          target,
          sourceBoxKey: box.key,
          isSelfReference,
          routeOutside,
        },
      ];
    })
  );
}

/**
 * Calculates the complete render model for one debugger execution step.
 *
 * This is the only public function in the layout module. It normalizes backend
 * data, positions the three visualization columns, calculates a responsive SVG
 * height, and resolves object references. It performs no DOM operations and
 * does not mutate the supplied step.
 *
 * @param {Object|null|undefined} step Debugger state to visualize.
 * @returns {Object} Positioned stack, heap, and static boxes together with SVG
 * dimensions, heap-object anchors, and resolved reference edges.
 */
export default function calculateLayout(step) {
  if (!step) {
    return {
      width: SVG_WIDTH,
      height: MIN_SVG_HEIGHT,
      stackBoxes: [],
      heapBoxes: [],
      staticBoxes: [],
      objectAnchors: {},
      references: [],
    };
  }

  const stackBoxes = createStackBoxes(step);
  const heapBoxes = createHeapBoxes(step);
  const staticBoxes = createStaticBoxes(step);
  const contentHeight = Math.max(
    getColumnHeight(stackBoxes),
    getColumnHeight(heapBoxes),
    getColumnHeight(staticBoxes)
  );
  // Leave one SVG unit below the common baseline so the border is not clipped.
  const height = Math.max(MIN_SVG_HEIGHT, contentHeight + COLUMN_TOP + 1);
  const baseline = height - 1;
  const stack = layoutColumn(stackBoxes, COLUMN_X.stack, baseline);
  const heap = layoutColumn(heapBoxes, COLUMN_X.heap, baseline);
  const staticColumn = layoutColumn(staticBoxes, COLUMN_X.static, baseline);

  const objectAnchors = getObjectAnchors(heap.boxes);

  const references = createReferences(
    [...stack.boxes, ...heap.boxes, ...staticColumn.boxes],
    objectAnchors
  );

  return {
    width: SVG_WIDTH,
    height,
    stackBoxes: stack.boxes,
    heapBoxes: heap.boxes,
    staticBoxes: staticColumn.boxes,
    objectAnchors,
    references,
  };
}
