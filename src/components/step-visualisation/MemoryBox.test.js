import { render, screen, within } from "@testing-library/react";
import { CHANGE_COLOURS } from "./constants";
import MemoryBox from "./MemoryBox";

function createBox() {
  return {
    key: "heap-10",
    kind: "heap",
    title: "Node",
    x: 20,
    y: 30,
    width: 200,
    height: 100,
    rows: [
      {
        key: "value",
        kind: "field",
        x: 30,
        y: 60,
        width: 180,
        height: 20,
        variable: {
          name: "value",
          type: "INT",
          value: "2",
          change: "modified",
          isChanged: true,
        },
      },
      {
        key: "val$captured",
        kind: "synthetic",
        x: 30,
        y: 80,
        width: 180,
        height: 20,
        variable: {
          name: "val$captured",
          type: "INT",
          value: "1",
          change: "unchanged",
          isChanged: false,
        },
      },
    ],
  };
}

describe("MemoryBox", () => {
  test("renders its title and formatted variable values", () => {
    render(
      <svg>
        <MemoryBox box={createBox()} ariaLabel="Heap object Node" />
      </svg>
    );

    expect(
      screen.getByRole("group", { name: "Heap object Node" })
    ).toBeInTheDocument();
    expect(screen.getByText("Node")).toBeInTheDocument();
    expect(screen.getByText("value: 2")).toBeInTheDocument();
  });

  test("uses change state colours and retains the boolean flag", () => {
    render(
      <svg>
        <MemoryBox box={createBox()} ariaLabel="Heap object Node" />
      </svg>
    );

    const changedRow = screen.getByTestId("variable-row-value");
    const unchangedRow = screen.getByTestId("variable-row-val$captured");

    expect(changedRow).toHaveAttribute("data-change", "modified");
    expect(changedRow).toHaveAttribute("data-is-changed", "true");
    expect(within(changedRow).getByTestId("variable-row-background")).toHaveAttribute(
      "fill",
      CHANGE_COLOURS.modified
    );
    expect(
      within(unchangedRow).getByTestId("variable-row-background")
    ).toHaveAttribute(
      "fill",
      CHANGE_COLOURS.unchanged
    );
  });

  test("distinguishes compiler-generated synthetic fields", () => {
    render(
      <svg>
        <MemoryBox box={createBox()} ariaLabel="Heap object Node" />
      </svg>
    );

    const syntheticRow = screen.getByTestId("variable-row-val$captured");

    expect(
      within(syntheticRow).getByTestId("variable-row-background")
    ).toHaveAttribute(
      "stroke-dasharray",
      "4 2"
    );
    expect(within(syntheticRow).getByText("val$captured: 1")).toHaveAttribute(
      "font-style",
      "italic"
    );
  });
});
