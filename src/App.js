import "./App.css";
import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-language_tools";

import axios from "axios";

import parser from "./lib/parser";

import { useState } from "react";

function App() {
  const [userInput, setUserInput] = useState("");

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

  const handleSubmit = async () => {
    try {
      console.log(userInput);
      const ast = parser.parse(userInput);
      console.log(ast);
      const res = await axios.get("http://localhost:4000/interpreter", {
        params: {
          data: ast,
        }
      })
      console.log(res);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="container">
      <h1 style={{marginBottom:36}}>Class Diagram</h1>
      <div className="row">
        <div className="col-lg-6">
          <h2 style={{marginBottom:18}}>Code Editor</h2>
          <AceEditor
            mode="java"
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
              <button onClick={handleSubmit} className="btn btn-primary">
                Submit
              </button>
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <h2 style={{marginBottom:18}}>Visualization</h2>
          {/*  visualization component */}
        </div>
      </div>
    </div>
  );
}

export default App;
