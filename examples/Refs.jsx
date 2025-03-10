import { render, setRef } from "../core/core.js";

const RefsExample = () => {
  const inputRef = setRef();

  return (
    <div>
      <input ref={inputRef} type="text" placeholder="Focus me!" />
      <button onClick={() => inputRef().focus()}>Focus Input</button>
    </div>
  );
};

// Render the app
render(RefsExample, document.getElementById("root"));
