import { render, screen, within } from "@testing-library/react";
import { CHANGE_COLOURS, SVG_WIDTH } from "./constants";
import StepVisualisation from "./StepVisualisation";

function createStep() {
  return {
    stackInfo: {
      stackFrames: [
        {
          methodName: "main",
          frameIndex: 0,
          localVariables: [
            {
              name: "node",
              id: 10,
              change: "created",
              isChanged: true,
            },
          ],
        },
      ],
    },
    heapInfo: {
      heapObjects: {
        "10": {
          id: 10,
          className: "Node",
          fields: {
            value: {
              name: "value",
              type: "INT",
              value: "1",
              change: "modified",
              isChanged: true,
            },
          },
          syntheticFields: {},
        },
      },
    },
    staticInfo: {
      staticVariables: {
        Example: {
          staticVariables: [
            {
              name: "root",
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

describe("StepVisualisation", () => {
  test("renders stack, heap, statics, and resolved references", () => {
    render(<StepVisualisation step={createStep()} />);

    const visualization = screen.getByRole("img", {
      name: "Program memory visualization",
    });

    expect(visualization).toHaveAttribute(
      "viewBox",
      expect.stringMatching(new RegExp(`^0 0 ${SVG_WIDTH} `))
    );
    expect(
      screen.getByRole("group", { name: "Stack frame main" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "Heap object Node, ID 10" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "Static class Example" })
    ).toBeInTheDocument();
    expect(screen.getAllByTestId("reference-edge")).toHaveLength(2);
    // SVG paints in DOM order: the frame backgrounds must not hide arrow origins.
    expect(visualization.lastElementChild).toHaveAttribute("aria-label", "Object references");
    expect(visualization).toHaveAttribute("preserveAspectRatio", "xMinYMax meet");
  });

  test("renders annotated change colours", () => {
    render(<StepVisualisation step={createStep()} />);
    const valueRow = screen.getByTestId("variable-row-value");

    expect(within(valueRow).getByTestId("variable-row-background")).toHaveAttribute(
      "fill",
      CHANGE_COLOURS.modified
    );
    expect(valueRow).toHaveAttribute("data-is-changed", "true");
  });

  test("renders an empty minimum-size SVG before a program is submitted", () => {
    render(<StepVisualisation step={null} />);

    expect(screen.queryAllByRole("group")).toHaveLength(0);
    expect(
      screen.getByRole("img", { name: "Program memory visualization" })
    ).toHaveAttribute(
      "viewBox",
      `0 0 ${SVG_WIDTH} 500`
    );
  });
});
