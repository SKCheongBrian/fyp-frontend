import calculateLayout from "./calculateLayout";
import { BOX, COLUMN_TOP, COLUMN_X, MIN_SVG_HEIGHT } from "./constants";

function createStep() {
  return {
    stackInfo: {
      // The backend emits the oldest frame first and the current frame last.
      stackFrames: [
        {
          methodName: "main",
          frameIndex: 1,
          localVariables: [
            {
              name: "node",
              id: 10,
              change: "unchanged",
              isChanged: false,
            },
          ],
        },
        {
          methodName: "foo",
          frameIndex: 0,
          localVariables: [
            {
              name: "x",
              type: "INT",
              value: "2",
              change: "modified",
              isChanged: true,
            },
          ],
        },
      ],
    },
    heapInfo: {
      // Deliberately unsorted to model Gson serialization of a Java HashMap.
      heapObjects: {
        "20": {
          id: 20,
          className: "Other",
          fields: {},
          syntheticFields: {},
        },
        "10": {
          id: 10,
          className: "Node",
          fields: {
            zField: {
              name: "zField",
              type: "INT",
              value: "2",
              change: "modified",
              isChanged: true,
            },
            aField: {
              name: "aField",
              type: "INT",
              value: "1",
              change: "unchanged",
              isChanged: false,
            },
          },
          syntheticFields: {
            "val$captured": {
              name: "val$captured",
              id: 20,
              change: "created",
              isChanged: true,
            },
          },
        },
      },
    },
    staticInfo: {
      staticVariables: {
        Zebra: {
          staticVariables: [],
        },
        Alpha: {
          staticVariables: [
            {
              name: "shared",
              id: 10,
              change: "unchanged",
              isChanged: false,
            },
          ],
        },
      },
    },
  };
}

describe("calculateLayout", () => {
  test("returns an empty minimum-sized layout when no step is supplied", () => {
    expect(calculateLayout(null)).toEqual({
      width: 900,
      height: MIN_SVG_HEIGHT,
      stackBoxes: [],
      heapBoxes: [],
      staticBoxes: [],
      objectAnchors: {},
      references: [],
    });
  });

  test("lays backend stack frames out bottom-up with position-stable keys", () => {
    const { stackBoxes } = calculateLayout(createStep());

    expect(stackBoxes.map((box) => box.key)).toEqual([
      "stack-0-main",
      "stack-1-foo",
    ]);
    expect(stackBoxes[0].y).toBeGreaterThan(stackBoxes[1].y);
    expect(stackBoxes[0].frameIndex).toBe(1);
    expect(stackBoxes[1].frameIndex).toBe(0);
  });

  test("sorts HashMap-backed boxes and fields deterministically", () => {
    const layout = calculateLayout(createStep());

    expect(layout.heapBoxes.map((box) => box.objectId)).toEqual(["10", "20"]);
    expect(layout.heapBoxes[0].rows.map((row) => row.key)).toEqual([
      "aField",
      "zField",
      "val$captured",
    ]);
    expect(layout.staticBoxes.map((box) => box.title)).toEqual([
      "Alpha",
      "Zebra",
    ]);
  });

  test("preserves change state and boolean flags on positioned rows", () => {
    const layout = calculateLayout(createStep());
    const nodeBox = layout.heapBoxes.find((box) => box.objectId === "10");
    const changedField = nodeBox.rows.find((row) => row.key === "zField");

    expect(changedField.variable).toEqual(
      expect.objectContaining({
        change: "modified",
        isChanged: true,
      })
    );
  });

  test("resolves references from stack, heap, and static variables", () => {
    const layout = calculateLayout(createStep());

    expect(layout.references).toHaveLength(3);
    expect(
      layout.references.map((reference) => reference.objectId).sort()
    ).toEqual(["10", "10", "20"]);
    expect(layout.objectAnchors["10"].left.x).toBe(COLUMN_X.heap);
  });

  test("marks self-references for routing outside their heap object", () => {
    const step = createStep();
    step.heapInfo.heapObjects["10"].fields.self = {
      name: "self",
      id: 10,
      change: "created",
      isChanged: true,
    };

    const layout = calculateLayout(step);
    const selfReference = layout.references.find(
      (reference) => reference.isSelfReference
    );

    expect(selfReference).toEqual(
      expect.objectContaining({
        objectId: "10",
        sourceBoxKey: "heap-10",
        isSelfReference: true,
      })
    );
    expect(selfReference.source.x).toBeLessThan(selfReference.target.x);
  });

  test("ignores references to heap objects absent from the snapshot", () => {
    const step = createStep();
    step.stackInfo.stackFrames[0].localVariables.push({
      name: "missing",
      id: 999,
      change: "created",
      isChanged: true,
    });

    const layout = calculateLayout(step);

    expect(
      layout.references.some((reference) => reference.objectId === "999")
    ).toBe(false);
  });

  test("grows beyond the minimum height for large snapshots", () => {
    const step = createStep();
    step.stackInfo.stackFrames[0].localVariables = Array.from(
      { length: 30 },
      (_, index) => ({
        name: `value${index}`,
        type: "INT",
        value: String(index),
        change: "unchanged",
        isChanged: false,
      })
    );

    expect(calculateLayout(step).height).toBeGreaterThan(MIN_SVG_HEIGHT);
  });

  test("calculates row and box dimensions from shared constants", () => {
    const layout = calculateLayout(createStep());
    const mainBox = layout.stackBoxes[0];

    expect(mainBox.height).toBe(
      BOX.headerHeight + BOX.rowHeight + BOX.bottomPadding
    );
    expect(mainBox.rows[0].x).toBe(COLUMN_X.stack + BOX.horizontalPadding);
    expect(layout.height).toBeGreaterThanOrEqual(MIN_SVG_HEIGHT);
    expect(mainBox.y).toBeGreaterThanOrEqual(COLUMN_TOP);
  });
});
