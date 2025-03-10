import { render, setSignal } from "../core/core.js";

// Create a simple counter component
const Counter = () => {
  const [count, setCount] = setSignal(0);

  return (
    <div>
      <h1>{() => count()}</h1>
      <button onClick={() => setCount(count() + 1)}>Increment</button>
    </div>
  );
};

// Render the app
render(Counter, document.getElementById("root"));
