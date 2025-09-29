import { useState } from "react";

const colorMap = {
    'white': 'W',
    'blue': 'U',
    'black': 'B',
    'red': 'R',
    'green': 'G',
  };

  function standardizeColors(unstandardizedColors) {
    return unstandardizedColors
    .toLowerCase()
    .replace(/[^a-z]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(c => colorMap[c] || c.toUpperCase())
    .join("");
  }
 
// Fetch legendary creatures from Scryfall by color identity
async function defineColorIdentityURL(colorIdentity) {
  
  let colors = standardizeColors(colorIdentity);
  if (!colors) throw new Error('Invalid color identity');
  if (colors.length > 5) throw new Error('Too many colors (max 5)');
  if (!/^[WUBRG]+$/.test(colors)) throw new Error('Invalid color codes');

  // Scryfall search query for legendary creatures with color identity
  const query = `identity=${colors} is:commander f:commander`;
  const url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}`;
  return url;
}

async function fetchCommandersByColorIdentity(colorIdentity) {
  const url = await defineColorIdentityURL(colorIdentity);
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch from Scryfall');
  const data = await response.json();
  // Return array of card objects (name, image, etc.)
  return data.data.map(card => ({
    name: card.name,
    image: card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal,
    scryfall_uri: card.scryfall_uri,
  }));
}

function pickRandomCommander(commanders) {
  if (commanders.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * commanders.length);
  return commanders[randomIndex];
}

function getWeightedRandomColorCount() {
  const weights = [0.20, 0.30, 0.30, 0.10, 0.10]; // for 1, 2, 3, 4, 5
  const rand = Math.random();
  let sum = 0;
  for (let i = 0; i < weights.length; i++) {
    sum += weights[i];
    if (rand < sum) return i + 1;
  }
}

function getRandomColorIdentity() {
  const allColors = ['W', 'U', 'B', 'R', 'G'];
  const count = getWeightedRandomColorCount();
  const shuffled = allColors.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).join('');
}

import "./App.css";

function App() {
  const [colorInput, setColorInput] = useState("");
  const [commanders, setCommanders] = useState([]);
  const [randomCommander, setRandomCommander] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const handleInputChange = (e) => setColorInput(e.target.value);

  const handleShowAll = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setCommanders([]);
    setRandomCommander(null);
    try {
      const results = await fetchCommandersByColorIdentity(colorInput);
      setCommanders(results);
    } catch (err) {
      setError("Failed to fetch commanders. Try a different color identity. Error: " + err.message);
    }
    setLoading(false);
  };

  const handleShowRandom = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setCommanders([]);
    setRandomCommander(null);
    try {
      const results = await fetchCommandersByColorIdentity(colorInput);
      setRandomCommander(pickRandomCommander(results));
    } catch (err) {
      setError("Failed to fetch commanders. Try a different color identity. Error: " + err.message);
    }
    setLoading(false);
  };

  const handleRandomColorIdentity = async (e) => {
    e.preventDefault();
    const randomColors = getRandomColorIdentity();
    setColorInput(randomColors);
  }

  return (
    <div style={{ maxWidth: 900, margin: '2em auto', padding: '2em', background: '#fff', borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}>
      <h1>Commander Finder</h1>
      <form style={{ margin: "2em 0", display: 'flex', flexDirection: 'column', gap: '1em' }}>
        <label htmlFor="color-input">Enter color identity (e.g., blue-black, UB): </label>
        <input
          id="color-input"
          type="text"
          value={colorInput}
          onChange={handleInputChange}
          placeholder="e.g., blue-black or UB"
          style={{ marginRight: "1em" }}
        />
        <button type="button" onClick={handleRandomColorIdentity}>
          Random Color Identity
        </button>
        <div style={{ marginTop: "1.5em", display: "flex", justifyContent: "center", alignItems: "center", gap: "1em", minHeight: "48px" }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1em' }}>
              <span style={{ fontWeight: 'bold', fontSize: '1.1em' }}>Searching...</span>
              <span className="loading-spinner" style={{ width: 24, height: 24, display: 'inline-block' }}></span>
            </div>
          ) : (
            <>
              <button type="button" onClick={handleShowAll} disabled={!colorInput.trim()}>
                Show All Commanders
              </button>
              <button type="button" onClick={handleShowRandom} disabled={!colorInput.trim()}>
                Show Random Commander
              </button>
            </>
          )}
        </div>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {randomCommander && (
        <div style={{ margin: '2em 0' }}>
          <h2>Random Commander</h2>
          <a
            href={randomCommander.scryfall_uri}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textAlign: 'center', width: '200px', textDecoration: 'none', color: 'inherit', display: 'inline-block' }}
          >
            {randomCommander.image && (
              <img
                src={randomCommander.image}
                alt={randomCommander.name}
                style={{ width: '100%', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
              />
            )}
            <div style={{ marginTop: '0.5em', fontWeight: 'bold' }}>{randomCommander.name}</div>
          </a>
        </div>
      )}
      {commanders.length > 0 && !randomCommander && (
        <div style={{ margin: '2em 0' }}>
          <h2>Possible Commanders</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1em' }}>
            {commanders.map((card) => (
              <a
                key={card.name}
                href={card.scryfall_uri}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textAlign: 'center', width: '200px', textDecoration: 'none', color: 'inherit' }}
              >
                {card.image && (
                  <img
                    src={card.image}
                    alt={card.name}
                    style={{ width: '100%', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                  />
                )}
                <div style={{ marginTop: '0.5em', fontWeight: 'bold' }}>{card.name}</div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}



export default App;
