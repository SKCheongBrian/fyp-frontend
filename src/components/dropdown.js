import React from "react";
import "./dropdown.css"; 

const DropDown = ({ options, onChange }) => {
  return (
    <select onChange={onChange}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default DropDown;
