import { render, setSignal, setMemo } from "../core/core.js";

const MemoExample = () => {
  const [firstName, setFirstName] = setSignal("John");
  const [lastName, setLastName] = setSignal("Doe");

  const fullName = setMemo(() => `${firstName()} ${lastName()}`);

  return (
    <div>
      <input
        value={() => firstName()}
        onInput={(e) => setFirstName(e.target.value)}
        placeholder="First Name"
      />
      <input
        value={() => lastName()}
        onInput={(e) => setLastName(e.target.value)}
        placeholder="Last Name"
      />
      <p>Full name: {() => fullName()}</p>
    </div>
  );
};

// Render the app
render(MemoExample, document.getElementById("root"));
