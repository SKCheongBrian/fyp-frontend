export function isReference(variable) {
  return variable?.id !== undefined;
}

export function getDisplayValue(variable) {
  return isReference(variable)
    ? ""
    : variable?.value ?? "";
}

export function getVariableLabel(variable) {
  const value = getDisplayValue(variable);

  return value === ""
    ? variable.name
    : `${variable.name}: ${value}`;
}