# Step visualization

This directory renders one debugger execution step as an SVG memory diagram.
The renderer is declarative React and does not mutate the SVG DOM.

## Data flow

1. `annotateProgramChanges` compares consecutive backend snapshots.
2. Every local variable, heap field, synthetic field, and static variable gets:
   - `change`: `created`, `modified`, or `unchanged`.
   - `isChanged`: `true` for created/modified and `false` for unchanged.
3. `calculateLayout` converts an annotated step into positioned boxes, rows,
   object anchors, and reference edges.
4. `StepVisualisation` composes the column and edge components into one SVG.

## Components

- `MemoryBox` draws the shared box header and variable rows.
- `StackColumn` draws stack frames in the backend's bottom-to-top order.
- `HeapColumn` draws heap objects and distinguishes synthetic fields with a
  dashed border and italic label.
- `StaticColumn` groups static variables by declaring class.
- `ReferenceEdges` draws curved arrows and routes self-references outside their
  heap object.

## Layout contract

`calculateLayout(step)` is a pure function. It returns:

```text
{
  width, height,
  stackBoxes, heapBoxes, staticBoxes,
  objectAnchors,
  references
}
```

The backend uses Java `HashMap` for heap objects, fields, and static classes, so
the layout sorts those values before positioning them. Stack frames are not
sorted: the backend deliberately emits the oldest frame first and the current
frame last.

The rendering components must use the coordinates from this result rather than
recalculating geometry. This keeps reference endpoints and box positions in
sync.

All three columns grow upward from one shared baseline. The SVG scales with
the pane width and is anchored at the bottom of the 500px editor-height pane;
taller diagrams can be scrolled upward without moving the base on each step.
Reference arrows are painted after the memory boxes so they visibly begin at
the variable-row border. Heap-to-heap arrows route around the right side of the
column to avoid crossing variable labels.

## Tests

Run all tests once with:

```shell
npm test -- --watchAll=false
```

Build the production bundle with:

```shell
npm run build
```
