import {
  html,
  render,
  setSignal,
  setEffect,
  setMemo,
  setRef,
  onMount,
  Fragment,
} from "./core/core.js";
import "./app.css";

const app = () => {
  const [ftech, setFtech] = setSignal([]);
  const [inputValue, setInputValue] = setSignal("");
  const [todos, setTodos] = setSignal([]);
  const [show, setShow] = setSignal(false);
  const [count, setCount] = setSignal(0);
  const [data, setData] = setSignal([
    {
      id: 1,
      name: "Abdullha",
      age: 20,
      email: "Abullha@gmail.com",
    },
    {
      id: 2,
      name: "jhon",
      age: 30,
      email: "jhon@gmail.com",
    },
  ]);
  const inputRef = setRef();
  const countRef = setRef();

  const addTodo = () => {
    if (inputValue().trim() !== "") {
      setTodos((prevTodos) => [...prevTodos, inputValue()]);
      setInputValue("");
    }
  };

  setEffect(() => {
    if (inputRef()) {
      inputRef().focus();
    }
  });

  onMount(() => {
    console.log("mounted");
    if (countRef()) {
      countRef().style.color = "red";
      console.log(countRef());
    }
  });

  setEffect(() => {
    fetch("https://jsonplaceholder.typicode.com/todos")
      .then((res) => res.json())
      .then((data) => setFtech(data));
  }, []);

  return (
    <>
      <div>
        <h1>Todo App</h1>
        <h1 ref={countRef}>{() => count()}</h1>
        <input
          ref={inputRef}
          type="text"
          value={inputValue()}
          onInput={(e) => setInputValue(e.target.value)}
          placeholder="Enter a new task"
        />
        <h1>{() => inputValue()}</h1>

        <button onClick={() => inputRef().focus()}>Focus</button>
        <button onClick={addTodo}>Add Todo</button>

        <ul>
          {() => todos().map((todo, index) => <li key={index}>{todo}</li>)}
        </ul>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="lucide lucide-arrow-down-right"
        >
          <path d="m7 7 10 10" />
          <path d="M17 7v10H7" />
        </svg>
        <button onClick={() => setShow(!show())}>Toggle</button>
        <div>{() => (show() ? <p>Hello</p> : <p>hi</p>)}</div>
        <div>
          <button onClick={() => setCount(count() + 1)}>{() => count()}</button>
        </div>
      </div>

      <ul>{() => data().map((item) => <li key={item.id}>{item.name}</li>)}</ul>

      <div>
        {() => ftech().map((item) => <li key={item.id}>{item.title}</li>)}
      </div>
    </>
  );
};

const root = document.getElementById("root");
render(app, root);
