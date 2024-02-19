import React from "react";
import "./stepslider.css"; // Import the ErrorBox CSS file

const StepSlider = ({ totalSteps, currentStep, onStepChange }) => {
  const handleChange = (event) => {
    const step = parseInt(event.target.value);
    onStepChange(step);
  };

  return (
    <div className="slider-container">
      <input
        type="range"
        min={0}
        max={totalSteps - 1}
        value={currentStep}
        onChange={handleChange}
        className="slider"
      />
      <span>Step: {currentStep}</span>
    </div>
  );
};

export default StepSlider;
