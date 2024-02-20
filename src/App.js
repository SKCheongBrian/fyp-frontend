import AceEditor from "react-ace";

import "ace-builds/src-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/theme-twilight";

import axios from "axios";

import { useEffect, useState } from "react";
import "./App.css";
import ErrorBox from "./components/errorbox";
import StepSlider from "./components/stepslider";
import StepVisualisation from "./components/step-visualisation";

function App() {
  const storedUserInput = localStorage.getItem('storedUserInput');
  const storedProgramData = JSON.parse(localStorage.getItem('storedProgramData'));
  const [userInput, setUserInput] = useState(storedUserInput == null ? "" : storedUserInput);
  const [isAgendaLoaded, setIsAgendaLoaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isErrorVisible, setIsErrorVisible] = useState(false);
  const [programData, setProgramData] = useState(storedProgramData);
  const [totalSteps, setTotalSteps] = useState(storedProgramData != null && storedProgramData.stepInfos != null ? storedProgramData.stepInfos.length : null);
  const [currentStepNumber, setCurrentStepNumber] = useState(0);
  const [currentStep, setCurrentStep] = useState({});
  const [methodColorMap, setMethodColorMap] = useState(new Map());
  const [currentMarker, setCurrentMarker] = useState([]);

  const handleCodeChange = (newCode) => {
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

  useEffect(() =>{
    console.log(currentStep);
    if (currentStep && currentStep.exceptionMessage !== undefined) {
      setErrorMessage(programData.stepInfos[currentStepNumber].exceptionMessage);
      setIsErrorVisible(true);
    }
  }, [currentStep]);

  const handleStepChange = (step) => {
    setCurrentStepNumber(step);
    setCurrentStep(programData.stepInfos[step]);
    const currentLine = programData.stepInfos[step].lineNumber - 1;
    setCurrentMarker([{
      startRow: currentLine,
      startCol: 2,
      endRow: currentLine,
      endCol: 20,
      className: 'line',
      type: 'fullLine'
    }]);
  };

  useEffect(() => {
    localStorage.setItem('storedUserInput', userInput);
  }, [userInput]);

  useEffect(() => {
    localStorage.setItem('storedProgramData', JSON.stringify(programData));
  }, [programData]);

  const handleTest = async () => {
    try {
      // const ast = parser.parse(userInput);
      const res = await axios.post("http://localhost:8080/test", {
        program: userInput,
      });
      console.log(res);
      if (res.data === null) {
        // TODO handle this better
        console.error("There is probably a compilation error");
      } else {
        setProgramData(res.data);
        setTotalSteps(res.data.stepInfos.length);
        console.log(programData);
        console.log(totalSteps);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleSubmit = async () => {
    try {
      console.log("userInput:---");
      console.log(userInput);
      // const ast = parser.parse(userInput);
      // console.log(ast);
      const res = await axios.post("http://localhost:8080/interpreter", {
        program: userInput,
      });
      console.log(res);
      if (res.status === 200) {
        setIsAgendaLoaded(true);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // test code
  const handleReset = async () => {
    try {
      const res = await axios.get("http://localhost:8080/interpreter/reset");
      console.log(res.data);
    } catch (error) {
      console.error("Error:", error);
    }
  };
  // end of test code

  function isError(obj) {
    return obj.hasOwnProperty("Error");
  }

  const handleEvalStep = async () => {
    try {
      if (!isAgendaLoaded) {
        setErrorMessage("Agenda is not loaded!");
        setIsErrorVisible(true);
        return;
      }
      const res = await axios.get("http://localhost:8080/interpreter/step");
      console.log("res", res);
      if (res.data === "") {
        return;
      }
      if (isError(res.data)) {
        setErrorMessage(res.data.Error);
        setIsErrorVisible(true);
      } else {
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleCloseError = () => {
    setIsErrorVisible(false);
  };

  return (
    <div className="container">
      <h1 style={{ marginBottom: 36 }}>Class Diagram</h1>
      <div className="row">
        <div className="col-lg-6">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2>Code Editor</h2>
            <button onClick={handleReset} className="btn btn-danger btn-sm">
              Reset
            </button>
          </div>
          <AceEditor
            mode="java"
            theme="twilight"
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
            highlightActiveLine={true}
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
              <input
                type="file"
                onChange={handleFileUpload}
                className="form-control-file"
              />
            </div>
            <div className="col-auto">
              <button onClick={handleSubmit} className="btn btn-primary btn-sm">
                Submit
              </button>
            </div>
            <div className="col-auto">
              <button
                onClick={handleEvalStep}
                className="btn btn-success btn-sm"
              >
                Eval Step
              </button>
            </div>
            <div className="col-auto">
              {/* ! this is test code */}
              <button onClick={handleTest} className="btn btn-warning btn-sm">
                Test
              </button>
              {/* end of test code */}
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
        <div className="col-lg-6">
          <h2 style={{ marginRight: "10px" }}>Visualization</h2>
          <StepVisualisation step={currentStep} methodColorMap={methodColorMap} />
        </div>
      </div>
      {isErrorVisible && (
        <ErrorBox message={errorMessage} onClose={handleCloseError} />
      )}
    </div>
  );
}

export default App;
