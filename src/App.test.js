import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
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
  jest.clearAllMocks();
});

test("submits stored Java source to the hosted API and displays its steps", async () => {
  const program = "class Main { public static void main(String[] args) {} }";
  localStorage.setItem("storedUserInput", program);
  axios.post.mockResolvedValueOnce({
    data: { isSuccess: true, stepInfos: [{ lineNumber: 1 }] },
  });
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /submit code/i }));

  expect(axios.post).toHaveBeenCalledWith("https://thisisadi.yoga:2030/run-debugger", { program });
  expect(await screen.findByText("Current Step: 0")).toBeInTheDocument();
  await waitFor(() => expect(screen.getByRole("button", { name: /submit code/i })).toBeEnabled());
});

test("shows API failures and allows another submission", async () => {
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  axios.post.mockRejectedValueOnce({ response: { data: { errorMessage: "Java executable not found" } } });
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /submit code/i }));

  expect(await screen.findByText("Java executable not found")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /submit code/i })).toBeEnabled();
  log.mockRestore();
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
