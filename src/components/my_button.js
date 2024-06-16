import { useCallback, useState } from "preact/hooks";
import React from "preact";

export default StampButton = ({ disabled, text }) => {
  const [pressed, setPressed] = useState(false);

  const handleOnClick = useCallback(() => {
    setPressed(true);
    setTimeout(() => {
      setPressed(false);
    }, 200);
  }, []);

  return (
    <button
      className="stamp-button"
      onClick={handleOnClick}
      type="submit"
      disabled={disabled}
    >
      <span className={"button-span " + (pressed ? "press" : "")}>{text}</span>
    </button>
  );
};
