import { render, screen } from "@testing-library/react";
import App from "./App";

jest.mock("ace-builds/src-noconflict/ext-language_tools", () => ({}));
jest.mock("ace-builds/src-noconflict/mode-java", () => ({}));
jest.mock("ace-builds/src-noconflict/theme-github", () => ({}));
jest.mock("ace-builds/src-noconflict/theme-twilight", () => ({}));

jest.mock("axios", () => ({
  post: jest.fn(),
}));

jest.mock("react-ace", () => {
  return function MockAceEditor() {
    return <textarea aria-label="Java code editor" readOnly />;
  };
});

jest.mock("./components/step-visualisation", () => {
  return function MockStepVisualisation() {
    return <svg aria-label="Program memory visualization" />;
  };
});

beforeEach(() => {
  localStorage.clear();
});

test("renders the Java visualizer interface", () => {
  render(<App />);

  expect(
    screen.getByRole("heading", {
      name: /java stack and heap visualiser/i,
    })
  ).toBeInTheDocument();
  expect(screen.getByLabelText(/java code editor/i)).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /submit code/i })
  ).toBeInTheDocument();
});
