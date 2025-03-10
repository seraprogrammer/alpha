import { render, setSignal } from "../core/core.js";

const TodoList = () => {
  const [todos, setTodos] = setSignal([
    { id: 1, text: "Learn Olova.js" },
    { id: 2, text: "Build an app" },
  ]);

  const [newTodo, setNewTodo] = setSignal("");

  const addTodo = () => {
    if (newTodo().trim()) {
      setTodos([...todos(), { id: Date.now(), text: newTodo() }]);
      setNewTodo("");
    }
  };

  return (
    <div>
      <div>
        <input
          value={() => newTodo()}
          onInput={(e) => setNewTodo(e.target.value)}
          placeholder="New todo"
        />
        <button onClick={addTodo}>Add Todo</button>
      </div>
      <ul>
        {() =>
          todos().map((todo) => (
            <li key={todo.id}>
              {todo.text}
              <button
                onClick={() =>
                  setTodos(todos().filter((t) => t.id !== todo.id))
                }
              >
                Delete
              </button>
            </li>
          ))
        }
      </ul>
    </div>
  );
};

// Render the app
render(TodoList, document.getElementById("root"));
