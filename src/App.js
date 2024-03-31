import AceEditor from "react-ace";

import "./App.css";

import "ace-builds/src-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/theme-twilight";

import axios from "axios";

import { useEffect, useState } from "react";
import ErrorBox from "./components/errorbox";
import StepVisualisation from "./components/step-visualisation";
import StepSlider from "./components/stepslider";
import DropDown from "./components/dropdown";

import AliasExample from "./examples/Alias.java";
import ConstructorExample from "./examples/Constructor.java";
import VariableCaptureExample from "./examples/VariableCapture.java";
import ScopingExample from "./examples/Scoping.java";
import StackFrameExample from "./examples/StackFrame.java";
import StackVsHeapExample from "./examples/StackVsHeap.java";

function App() {
  const storedUserInput = localStorage.getItem("storedUserInput");
  const storedProgramData = JSON.parse(
    localStorage.getItem("storedProgramData")
  );
  const [userInput, setUserInput] = useState(
    storedUserInput == null ? "" : storedUserInput
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [isErrorVisible, setIsErrorVisible] = useState(false);
  const [programData, setProgramData] = useState(storedProgramData);
  const [totalSteps, setTotalSteps] = useState(
    storedProgramData?.stepInfos != null
      ? storedProgramData.stepInfos.length
      : null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [currentStepNumber, setCurrentStepNumber] = useState(null);
  const [currentStep, setCurrentStep] = useState({});
  const [currentMarker, setCurrentMarker] = useState([]);

  const exampleOptions = [
    { label: "Examples", value: "" },
    {
      label: "Alias",
      value: `
class Point {
  public final int x;
  public final int y;

  public Point(int x, int y) {
    this.x = x;
    this.y = y;
  }
}

public class Alias {
  public static Point mystery(Point p) {
    p = new Point(2, 2);
    return p;
  }

  public static void main(String[] args) {
    Point p = new Point(1, 1);
    Point p2 = mystery(p); // notice that p points to same object
  }
}
    `,
    },
    {
      label: "Constructor",
      value: `
class Node {
  private int value;
  private Node next;

  public Node(int value, Node next) {
    this.value = value;
    this.next = next;
  }

  public Node(int value) {
    this.value = value;
  }
}

class Constructor {
  private int a;
  private int b;
  private int c;
  private Node node;

  public Constructor(int a, int b, int c, Node node) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.node = node;
  }
  
  public static void main(String[] args) {
    Constructor example = new Constructor(1, 2, 3, new Node(4));
  }
}
    `,
    },
    {
      label: "Scoping",
      value: `
public class Scoping {
  private int x;

  public Scoping(int x) {
    this.x = x;
  }

  private void firstMethod() {
    x = 2; // Notice this changes this.x
    int x = 2; // Notice a new variable is added onto stack
    this.x = x + 10; // x on right hand side refers to variable x
    secondMethod(x);
  }

  private void secondMethod(int x) {
    x = 10;
    this.x = x - 10;
  }

  public static void main(String[] args) {
    Scoping scoping = new Scoping(1);
    scoping.firstMethod();
  }
}
    `,
    },
    {
      label: "StackFrame",
      value: `
public class StackFrame {
  public static void foo() {
    int x = 2;
    bar(x + 1);
  }

  public static void bar(int x) {
    baz(x + 1);
  }

  public static void baz(int x) {
    x = 4;
  }

  public static void main(String[] args) {
    int x = 1;
    foo();
  }
}
`,
    },
    {
      label: "StackVsHeap",
      value: `
public class StackVsHeap {
  public static void main(String[] args) {
    int x = 1; // notice this is on the stack
    Integer y1 = 2; // notice this is on the heap
    Integer y2 = 2; // notice the caching for values <= 128
    Integer z1 = 129; // notice this is > 128
    Integer z2 = 129; // notice no caching (new Integer created)
    boolean b = true; // on the stack
    Boolean b2 = true; // created on the heap
    Boolean b3 = true; // on the heap with caching
  }  
}
`,
    },
    {
      label: "VariableCapture",
      value: `
interface C {
  void g();
}
    
class A {
  int x = 1;
    
  C f() {
    int y = 2;

    class B implements C {
      @Override
      public void g() {
        x = y; // accessing x and y is OK.
      }
    }

    B b = new B();
    return b;
  }
}
    
public class VariableCapture {
  public static void main(String[] args) {
    A a = new A();
    C b = a.f(); // notice y is no longer on stack
    b.g(); // uses the captured variable (val$y) to get value of y
    // notice the value of a's x
  }
}
`,
    },
  ];

  const handleExampleChange = (selectedOption) => {
    const selectedValue = selectedOption.target.value;
    console.log("selected option: ", selectedOption);
    console.log("selectedvalue: ", selectedValue);
    setUserInput(selectedValue);
  };

  const handleCodeChange = (newCode) => {
    setCurrentStep({});
    setCurrentMarker([]);
    setCurrentStepNumber(null);
    setUserInput(newCode);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const fileContent = e.target.result;
      setUserInput(fileContent);
    };

    reader.readAsText(file);
  };

  useEffect(() => {
    console.log(currentStep);
    if (currentStep && currentStep.exceptionMessage !== undefined) {
      setErrorMessage(
        programData.stepInfos[currentStepNumber].exceptionMessage
      );
      setIsErrorVisible(true);
    }
  }, [currentStep]);

  const handleStepChange = (step) => {
    setCurrentStepNumber(step);
    if (!programData?.stepInfos?.[step]) {
      return;
    }
    setCurrentStep(programData.stepInfos[step]);
    console.log("hais", programData.stepInfos[step]);
    const currentLine = programData.stepInfos[step].lineNumber - 1;
    setCurrentMarker([
      {
        startRow: currentLine,
        startCol: 2,
        endRow: currentLine,
        endCol: 20,
        className: "line",
        type: "fullLine",
      },
    ]);
  };

  useEffect(() => {
    localStorage.setItem("storedUserInput", userInput);
  }, [userInput]);

  useEffect(() => {
    localStorage.setItem("storedProgramData", JSON.stringify(programData));
    if (programData?.stepInfos) {
      handleStepChange(0);
    }
  }, [programData]);

  function compilationError(errorMessage) {
    setErrorMessage(
      "There is probably a compilation error. Please double check that your code is compilable.\n\n" +
        errorMessage
    );
    setIsErrorVisible(true);
    setProgramData(null);
    setCurrentStep({});
    setCurrentMarker([]);
    setCurrentStepNumber(null);
  }

  const handleTest = async () => {
    setIsLoading(true);
    try {
      const res = await axios.post("https://thisisadi.yoga:2030/run-debugger", {
        program: userInput,
      });
      console.log("res:", res);
      if (!res.data.isSuccess) {
        const errorMessage = res.data.errorMessage;
        compilationError(errorMessage);
      } else {
        setProgramData(res.data);
        setTotalSteps(res.data.stepInfos.length);
        console.log("programData: ", programData);
        console.log("totalSteps: ", totalSteps);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
      console.log("currentStep after clearing: ", currentStep);
    }
  };

  const handleBackwardStep = () => {
    if (currentStepNumber > 0) {
      handleStepChange(currentStepNumber - 1);
    }
  };

  const handleForwardStep = () => {
    if (currentStepNumber < totalSteps - 1) {
      handleStepChange(currentStepNumber + 1);
    }
  };

  const handleCloseError = () => {
    setIsErrorVisible(false);
  };

  const handleFeedback = () => {
    window.open("https://forms.gle/paS2rmhDB6VupNUVA", "_blank");
  }

  return (
    <div className="">
      <header className="header">
        <h1>Java Stack and Heap Visualiser</h1>
      </header>
      <div className="content">
        <div className="l5">
          <span className="subtitle">
            <h2>Code Editor</h2>
            <DropDown
              options={exampleOptions}
              onChange={handleExampleChange}
            ></DropDown>
            <button onClick={handleFeedback} className="button">Feedback</button>

          </span>
          <AceEditor
            mode="java"
            theme="github"
            value={userInput}
            onChange={handleCodeChange}
            name="java-code-editor"
            editorProps={{ $blockScrolling: true }}
            height="500px"
            width="100%"
            fontSize={14}
            showPrintMargin={true}
            showGutter={true}
            markers={currentMarker}
            highlightActiveLine={false}
            setOptions={{
              enableBasicAutocompletion: true,
              enableLiveAutocompletion: true,
              enableSnippets: true,
              showLineNumbers: true,
              tabSize: 2,
            }}
          />
          <div className="row mt-3">
            <div className="col">
              <label className="button btn-flex">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                />
                Upload File
              </label>
              <span className="stepNumber">
                {currentStepNumber != null
                  ? `Current Step: ${currentStepNumber}`
                  : "Please submit a program"}
              </span>
            </div>
            <div className="col-auto">
              <button onClick={handleBackwardStep} className="button btn-flex">
                Step Backward
              </button>
            </div>
            <div className="col-auto">
              <button onClick={handleForwardStep} className="button btn-flex">
                Step Forward
              </button>
            </div>
            <div className="col-auto">
              <button onClick={handleTest} className="button btn-flex">
                Submit Code
              </button>
            </div>
            {programData && totalSteps && (
              <StepSlider
                totalSteps={totalSteps}
                currentStep={currentStepNumber}
                onStepChange={handleStepChange}
              />
            )}
          </div>
        </div>
        <div className="r5">
          <h2 style={{ marginBottom: 22, marginRight: "10px" }}>
            Visualization
          </h2>
          <div className="visualisation-container">
            <StepVisualisation step={currentStep} />
          </div>
        </div>
      </div>
      {isErrorVisible && (
        <ErrorBox message={errorMessage} onClose={handleCloseError} />
      )}
      <div className={isLoading ? "loading-spinner-container" : ""}>
        {isLoading && <div className="loading-spinner"></div>}
        {isLoading && <div>Loading...</div>}
      </div>
    </div>
  );
}

export default App;
