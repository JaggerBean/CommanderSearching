import "./App.css";
import { useState, useReducer } from "react";
function Header({ name, year, course }) {
  return (
    <header>
      <h1>
        {name}'s {course} Learning
      </h1>
      <p>Copyright {year}</p>
    </header>
  );
}
const items = ["Beginner", "Intermediate", "Advanced"];

const levelsObjects = items.map((item, i) => ({
  id: i,
  value: item,
  count: 0,
}));

function Main({ levels }) {
  return (
    <main>
      <img
        src="https://github.com/Hriju-Shreshtha.png"
        height={200}
        alt="food"
      />
      <ul>
        {levels.map((item) => (
          <li key={item.id} style={{ listStyleType: "none" }}>
            {item.value}
            {item.count}
          </li>
        ))}
      </ul>
    </main>
  );
}

function App() {
  // const [status, setStatus] = useState(true);
  const [status, toggleStatus] = useReducer((status)=>!status, true);
  return (
    <div>
      <h1>The course is {status ? "Available" : "Closed"}.</h1>
      <button onClick={toggleStatus}>
        {" "}
        Course is {status ? "Full" : "Available"}
      </button>
      <Header name="Hriju" year={new Date().getFullYear()} course="React" />
      <Main levels={levelsObjects} openStatus={status} onStatus={toggleStatus} />
      <main>
        <h2>We serve the most delicious food around</h2>
      </main>
    </div>
  );
}

export default App;
