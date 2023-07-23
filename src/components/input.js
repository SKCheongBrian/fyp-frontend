import { faFile } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function Input() {
  return (
    <div style={{ height: 38 }}>
      <span><FontAwesomeIcon icon={faFile} /></span>
      <div>
        <input type="file"></input>
      </div>
    </div>
  );
}

export default Input;
