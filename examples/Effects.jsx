import { render, setSignal, setEffect } from "../core/core.js";

const EffectsExample = () => {
  const [name, setName] = setSignal("John");

  setEffect(() => {
    console.log(`Name changed to: ${name()}`);
  });

  return (
    <div>
      <input
        value={() => name()}
        onInput={(e) => setName(e.target.value)}
        type="text"
      />
      <p>Current name: {() => name()}</p>
    </div>
  );
};

// Render the app
render(EffectsExample, document.getElementById("root"));
