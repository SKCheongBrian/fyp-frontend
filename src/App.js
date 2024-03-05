import AceEditor from "react-ace";

import "./App.css";

import "ace-builds/src-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/theme-twilight";
import "ace-builds/src-noconflict/theme-github";

import axios from "axios";

import { useEffect, useState } from "react";
import ErrorBox from "./components/errorbox";
import StepSlider from "./components/stepslider";
import StepVisualisation from "./components/step-visualisation";

function App() {
  const storedUserInput = localStorage.getItem('storedUserInput');
  const storedProgramData = JSON.parse(localStorage.getItem('storedProgramData'));
  const [userInput, setUserInput] = useState(storedUserInput == null ? "" : storedUserInput);
  const [errorMessage, setErrorMessage] = useState("");
  const [isErrorVisible, setIsErrorVisible] = useState(false);
  const [programData, setProgramData] = useState(storedProgramData);
  const [totalSteps, setTotalSteps] = useState(storedProgramData != null && storedProgramData.stepInfos != null ? storedProgramData.stepInfos.length : null);
  const [currentStepNumber, setCurrentStepNumber] = useState(null);
  const [currentStep, setCurrentStep] = useState({});
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

  useEffect(() => {
    console.log(currentStep);
    if (currentStep && currentStep.exceptionMessage !== undefined) {
      setErrorMessage(programData.stepInfos[currentStepNumber].exceptionMessage);
      setIsErrorVisible(true);
    }
  }, [currentStep]);

  const handleStepChange = (step) => {
    setCurrentStepNumber(step);
    if (!programData || !programData.stepInfos || !programData.stepInfos[step]) { return; }
    setCurrentStep(programData.stepInfos[step]);
    console.log("hais", programData.stepInfos[step])
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
    if (programData && programData.stepInfos) {
      handleStepChange(0);
    }
  }, [programData]);

  const handleTest = async () => {
    try {
      // const ast = parser.parse(userInput);
      const res = await axios.post("http://localhost:8080/test", {
        program: userInput,
      });
      console.log(res);
      if (res.data === null || res.data.stepInfos === undefined) {
        setErrorMessage("There is probably a compilation error. Please double check that your code is compilable.\n");
        setIsErrorVisible(true);
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

  function isError(obj) {
    return obj.hasOwnProperty("Error");
  }

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

  return (
    <div className="">
      <header className="header">
        <h1>Java Stack and Heap Visualiser</h1>
      </header>
      <div className="content">
        <div className="l5">
          <span className="subtitle">
            <h2>Code Editor</h2>
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
                  style={{ display: 'none' }} // Hide the input element
                />
                Upload File
              </label>
              <span className="stepNumber">{currentStepNumber != null ? `Current Step: ${currentStepNumber}` : "Please submit a program"}</span>
            </div>
            <div className="col-auto">
              <button onClick={handleBackwardStep} className="button btn-flex">
                Step Backward
              </button>
            </div>
            <div className="col-auto">
              <button
                onClick={handleForwardStep}
                className="button btn-flex"
              >
                Step Forward
              </button>
            </div>
            <div className="col-auto">
              {/* ! this is test code */}
              <button onClick={handleTest} className="button btn-flex">
                Submit Code
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
        <div className="r5">
          <h2 style={{ marginBottom: 22, marginRight: "10px" }}>Visualization</h2>
          <div className="visualisation-container">
            <StepVisualisation step={currentStep} />
          </div>
        </div>
      </div>
      {isErrorVisible && (
        <ErrorBox message={errorMessage} onClose={handleCloseError} />
      )}
    </div>
  );
}

export default App;
