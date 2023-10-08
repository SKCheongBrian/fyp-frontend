import AceEditor from "react-ace";

import "ace-builds/src-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/theme-twilight";

import axios from "axios";

import { parse } from "flatted";

import parser from "./lib/parser";

import { useState } from "react";
import "./App.css";
import StackVisualisation from "./components/stack-visualisation";
import ErrorBox from "./components/errorbox";

function App() {
  const [userInput, setUserInput] = useState("");
  const [isAgendaLoaded, setIsAgendaLoaded] = useState(false);
  const [stackFrames, setStackFrames] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isErrorVisible, setIsErrorVisible] = useState(false);


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

  const handleTest = async () => {
    try {
      const ast = parser.parse(userInput);
      const res = await axios.post("http://localhost:4000/test", ast);
      const newAst = res.data.AST;
      const scopes = parse(res.data.scopes);
      console.log(newAst);
      console.log(scopes);
    } catch (error) {
      console.error("Error:", error);
    }
  }

  const handleSubmit = async () => {
    try {
      console.log("userInput:---");
      console.log(userInput);
      const ast = parser.parse(userInput);
      console.log(ast);
      const res = await axios.post("http://localhost:4000/interpreter", ast);
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
      const res = await axios.get("http://localhost:4000/interpreter/reset");
      console.log(res.data);
    } catch (error) {
      console.error("Error:", error);
    }
    setStackFrames([]);
  };
  // end of test code

  function isError(obj){
    return obj.hasOwnProperty("Error");
}

  const handleEvalStep = async () => {
    try {
      if (!isAgendaLoaded) {
        setErrorMessage("Agenda is not loaded!");
        setIsErrorVisible(true);
        return;     
      }
      const res = await axios.get("http://localhost:4000/interpreter/step");
      console.log("res", res);
      if (res.data === "") {
        return;
      }
      if (isError(res.data)) {
        setErrorMessage(res.data.Error);
        setIsErrorVisible(true);
      }
      setStackFrames(res.data);
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
              <button
                onClick={handleTest}
                className="btn btn-warning btn-sm"
              >
                Test
              </button>
              {/* end of test code */}
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <h2 style={{ marginRight: "10px" }}>Visualization</h2>
          <StackVisualisation stackFrames={stackFrames} />
        </div>
      </div>
      {isErrorVisible && (
        <ErrorBox message={errorMessage} onClose={handleCloseError} />
      )}
    </div>
  );
}

export default App;
