import annotateProgramChanges from "./annotateProgramChanges";

function createProgramData() {
  return {
    isSuccess: true,
    stepInfos: [
      {
        stepNumber: 0,
        lineNumber: 1,
        exceptionMessage: null,
        stackInfo: {
          stackFrames: [
            {
              methodName: "main",
              frameIndex: 0,
              localVariables: [
                { name: "x", type: "INT", value: "1" },
                { name: "node", id: 10 },
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
                value: { name: "value", type: "INT", value: "1" },
                next: { name: "next", type: "UNKNOWN", value: "null" },
              },
              syntheticFields: {
                "val$captured": {
                  name: "val$captured",
                  type: "INT",
                  value: "1",
                },
              },
            },
          },
          visitedObjects: [10],
        },
        staticInfo: {
          staticVariables: {
            Example: {
              className: "Example",
              staticVariables: [
                { name: "count", type: "INT", value: "1" },
              ],
            },
          },
        },
      },
      {
        stepNumber: 1,
        lineNumber: 2,
        exceptionMessage: null,
        stackInfo: {
          stackFrames: [
            {
              methodName: "main",
              frameIndex: 0,
              localVariables: [
                { name: "x", type: "INT", value: "2" },
                { name: "node", id: 10 },
                { name: "y", type: "INT", value: "3" },
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
                value: { name: "value", type: "INT", value: "2" },
                next: { name: "next", id: 11 },
              },
              syntheticFields: {
                "val$captured": {
                  name: "val$captured",
                  type: "INT",
                  value: "1",
                },
              },
            },
            "11": {
              id: 11,
              className: "Node",
              fields: {},
              syntheticFields: {},
            },
          },
          visitedObjects: [10, 11],
        },
        staticInfo: {
          staticVariables: {
            Example: {
              className: "Example",
              staticVariables: [
                { name: "count", type: "INT", value: "2" },
              ],
            },
          },
        },
      },
    ],
  };
}

describe("annotateProgramChanges", () => {
  test("marks variables and fields in the first step as created", () => {
    const result = annotateProgramChanges(createProgramData());
    const firstStep = result.stepInfos[0];

    expect(
      firstStep.stackInfo.stackFrames[0].localVariables.map(
        (variable) => variable.change
      )
    ).toEqual(["created", "created"]);

    expect(firstStep.heapInfo.heapObjects["10"].fields.value.change).toBe(
      "created"
    );
    expect(
      firstStep.heapInfo.heapObjects["10"].syntheticFields["val$captured"]
        .change
    ).toBe("created");
    expect(
      firstStep.staticInfo.staticVariables.Example.staticVariables[0].change
    ).toBe("created");

    expect(
      firstStep.stackInfo.stackFrames[0].localVariables.every(
        (variable) => variable.isChanged
      )
    ).toBe(true);
    expect(firstStep.heapInfo.heapObjects["10"].fields.value.isChanged).toBe(
      true
    );
  });

  test("detects modified, unchanged, and created local variables", () => {
    const result = annotateProgramChanges(createProgramData());
    const variables =
      result.stepInfos[1].stackInfo.stackFrames[0].localVariables;

    expect(variables).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "x", change: "modified" }),
        expect.objectContaining({
          name: "node",
          change: "unchanged",
          isChanged: false,
        }),
        expect.objectContaining({ name: "y", change: "created" }),
      ])
    );
  });

  test("detects primitive and reference changes in heap fields", () => {
    const result = annotateProgramChanges(createProgramData());
    const object = result.stepInfos[1].heapInfo.heapObjects["10"];

    expect(object.fields.value.change).toBe("modified");
    expect(object.fields.next.change).toBe("modified");
    expect(object.syntheticFields["val$captured"].change).toBe("unchanged");
  });

  test("detects modified static variables", () => {
    const result = annotateProgramChanges(createProgramData());
    const count =
      result.stepInfos[1].staticInfo.staticVariables.Example.staticVariables[0];

    expect(count.change).toBe("modified");
    expect(count.isChanged).toBe(true);
  });

  test("matches existing frames by bottom-up position when frameIndex changes", () => {
    const programData = createProgramData();
    const firstMain = programData.stepInfos[0].stackInfo.stackFrames[0];
    const secondMain = programData.stepInfos[1].stackInfo.stackFrames[0];

    firstMain.localVariables = [
      { name: "x", type: "INT", value: "1" },
    ];
    secondMain.frameIndex = 1;
    secondMain.localVariables = [
      { name: "x", type: "INT", value: "1" },
    ];
    programData.stepInfos[1].stackInfo.stackFrames.push({
      methodName: "calledMethod",
      frameIndex: 0,
      localVariables: [],
    });

    const result = annotateProgramChanges(programData);
    const mainVariable =
      result.stepInfos[1].stackInfo.stackFrames[0].localVariables[0];

    expect(mainVariable).toEqual(
      expect.objectContaining({
        change: "unchanged",
        isChanged: false,
      })
    );
  });

  test("does not mutate the backend response", () => {
    const programData = createProgramData();
    const original = JSON.parse(JSON.stringify(programData));

    annotateProgramChanges(programData);

    expect(programData).toEqual(original);
  });

  test("returns failed program data unchanged", () => {
    const failure = {
      isSuccess: false,
      errorMessage: "Compilation failed",
    };

    expect(annotateProgramChanges(failure)).toBe(failure);
  });
});
