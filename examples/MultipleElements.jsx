import { render, Fragment } from "../core/core.js";

const MultipleElements = () => {
  return (
    <>
      <div>First</div>
      <div>Second</div>
    </>
  );
};

// Render the app
render(MultipleElements, document.getElementById("root"));
