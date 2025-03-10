import { render, setSignal } from "../core/core.js";

const Conditional = () => {
  const [show, setShow] = setSignal(false);
  const [theme, setTheme] = setSignal("light");

  return (
    <div>
      <button onClick={() => setShow(!show())}>Toggle Content</button>
      <button onClick={() => setTheme(theme() === "light" ? "dark" : "light")}>
        Toggle Theme
      </button>

      {/* Simple conditional */}
      {() => (show() ? <p>Content is shown</p> : <p>Content is hidden</p>)}

      {/* Conditional with multiple elements */}
      {() =>
        theme() === "light" ? (
          <div style={{ background: "white", color: "black" }}>Light Theme</div>
        ) : (
          <div style={{ background: "black", color: "white" }}>Dark Theme</div>
        )
      }

      {/* Conditional rendering with && operator */}
      {() => show() && <p>This only shows when show is true</p>}
    </div>
  );
};

// Render the app
render(Conditional, document.getElementById("root"));
