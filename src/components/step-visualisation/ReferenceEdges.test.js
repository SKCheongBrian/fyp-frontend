import { render, screen } from "@testing-library/react";
import ReferenceEdges, { createReferencePath } from "./ReferenceEdges";

describe("ReferenceEdges", () => {
  test("creates a curved path between different boxes", () => {
    const path = createReferencePath({
      source: { x: 10, y: 20 },
      target: { x: 100, y: 80 },
      isSelfReference: false,
    });

    expect(path).toBe("M 10 20 C 55 20, 55 80, 100 80");
  });

  test("routes self-references outside the heap object", () => {
    const path = createReferencePath({
      source: { x: 510, y: 100 },
      target: { x: 520, y: 40 },
      isSelfReference: true,
    });

    expect(path).toBe("M 510 100 C 580 100, 580 40, 520 40");
  });

  test("renders arrow markers and reference metadata", () => {
    const reference = {
      key: "stack-0-node-10",
      objectId: "10",
      source: { x: 10, y: 20 },
      target: { x: 100, y: 80 },
      isSelfReference: false,
    };
    render(
      <svg>
        <ReferenceEdges references={[reference]} />
      </svg>
    );

    const edge = screen.getByTestId("reference-edge");

    expect(screen.getByTestId("reference-arrowhead")).toBeInTheDocument();
    expect(edge).toHaveAttribute("marker-end", "url(#reference-arrowhead)");
    expect(edge).toHaveAttribute("data-self-reference", "false");
  });
});
