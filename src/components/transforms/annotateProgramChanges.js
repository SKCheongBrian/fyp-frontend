import { isReference } from "../step-visualisation/variableUtils";

const CREATED = "created";
const MODIFIED = "modified";
const UNCHANGED = "unchanged";

function variablesAreEqual(current, previous) {
  if (!current || !previous) {
    return false;
  }

  const currentIsReference = isReference(current);
  const previousIsReference = isReference(previous);

  if (currentIsReference !== previousIsReference) {
    return false;
  }

  // Both values are references. Java object identity is represented by the
  // JDI unique ID supplied by the backend.
  if (currentIsReference) {
    return String(current.id) === String(previous.id);
  }

  return current.type === previous.type && current.value === previous.value;
}

function annotateVariable(current, previous) {
  let change = UNCHANGED;

  if (!previous) {
    change = CREATED;
  } else if (!variablesAreEqual(current, previous)) {
    change = MODIFIED;
  }

  return {
    ...current,
    change,
    // `change` retains the richer created/modified/unchanged state, while the
    // boolean is convenient for renderers that only need highlight/no-highlight.
    isChanged: change !== UNCHANGED,
  };
}

function annotateStack(currentStack, previousStack) {
  const currentFrames = currentStack?.stackFrames ?? [];
  const previousFrames = previousStack?.stackFrames ?? [];

  const stackFrames = currentFrames.map(
    (currentFrame, framePosition) => {
      const candidate = previousFrames[framePosition];

      const previousFrame =
        candidate?.methodName === currentFrame.methodName
          ? candidate
          : undefined;

      const previousVariables = new Map(
        (previousFrame?.localVariables ?? []).map((variable) => [
          variable.name,
          variable
        ])
      );

      const annotatedLocalVariables = (
        currentFrame.localVariables ?? []
      ).map((currentVariable) =>
        annotateVariable(
          currentVariable,
          previousVariables.get(currentVariable.name)
        )
      );

      return {
        ...currentFrame,
        localVariables: annotatedLocalVariables,
      };
    }
  );

  return {
    ...currentStack,
    stackFrames,
  };
}

function annotateFieldMap(
  currentFields = {},
  previousFields = {}
) {
  return Object.fromEntries(
    Object.entries(currentFields).map(
      ([fieldName, currentField]) => [
        fieldName,
        annotateVariable(
          currentField,
          previousFields[fieldName]
        ),
      ]
    )
  );
}

function annotateHeap(currentHeap, previousHeap) {
  const currentObjects = currentHeap?.heapObjects ?? {};
  const previousObjects = previousHeap?.heapObjects ?? {};

  const heapObjects = Object.fromEntries(
    Object.entries(currentObjects).map(
      ([objectId, currentObject]) => {
        const previousObject = previousObjects[objectId];

        return [
          objectId,
          {
            ...currentObject,

            fields: annotateFieldMap(
              currentObject.fields,
              previousObject?.fields
            ),

            syntheticFields: annotateFieldMap(
              currentObject.syntheticFields,
              previousObject?.syntheticFields
            ),
          },
        ];
      }
    )
  );

  return {
    ...currentHeap,
    heapObjects,
  };
}

function annotateStatics(currentStatic, previousStatic) {
  const currentClasses =
    currentStatic?.staticVariables ?? {};

  const previousClasses =
    previousStatic?.staticVariables ?? {};

  const staticVariables = Object.fromEntries(
    Object.entries(currentClasses).map(
      ([className, currentClass]) => {
        const previousClass = previousClasses[className];

        const previousVariables = new Map(
          (previousClass?.staticVariables ?? []).map(
            (variable) => [variable.name, variable]
          )
        );

        const annotatedVariables = (
          currentClass.staticVariables ?? []
        ).map((currentVariable) =>
          annotateVariable(
            currentVariable,
            previousVariables.get(currentVariable.name)
          )
        );

        return [
          className,
          {
            ...currentClass,
            staticVariables: annotatedVariables,
          },
        ];
      }
    )
  );

  return {
    ...currentStatic,
    staticVariables,
  };
}

function annotateStep(currentStep, previousStep) {
  return {
    ...currentStep,

    stackInfo: annotateStack(
      currentStep.stackInfo,
      previousStep?.stackInfo
    ),

    heapInfo: annotateHeap(
      currentStep.heapInfo,
      previousStep?.heapInfo
    ),

    staticInfo: annotateStatics(
      currentStep.staticInfo,
      previousStep?.staticInfo
    ),
  };
}

export default function annotateProgramChanges(programData) {
  if (!programData?.isSuccess || !programData.stepInfos) {
    return programData;
  }

  const stepInfos = programData.stepInfos.map(
    (currentStep, stepIndex, allSteps) =>
      annotateStep(
        currentStep,
        allSteps[stepIndex - 1]
      )
  );

  return {
    ...programData,
    stepInfos,
  };
}
