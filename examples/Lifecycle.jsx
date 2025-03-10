import { render, setSignal, onMount, onUnmount } from "../core/core.js";

const LifecycleExample = () => {
  const [isVisible, setIsVisible] = setSignal(true);

  const ChildComponent = () => {
    onMount(() => {
      console.log("Component mounted");
    });

    onUnmount(() => {
      console.log("Component will unmount");
    });

    return <div>Hello World</div>;
  };

  return (
    <div>
      <button onClick={() => setIsVisible(!isVisible())}>
        {() => (isVisible() ? "Hide" : "Show")}
      </button>
      {() => isVisible() && <ChildComponent />}
    </div>
  );
};

// Render the app
render(LifecycleExample, document.getElementById("root"));
