import React from "react";
import "./errorbox.css"; // Import the ErrorBox CSS file

const ErrorBox = ({ message, onClose }) => {
  return (
    <div className="error-box-container">
      <div className="error-box">
        <div className="error-message" >{message}</div>
        <button className="button btn-flex" onClick={onClose}>
          Ok
        </button>
      </div>
    </div>
  );
};

export default ErrorBox;
