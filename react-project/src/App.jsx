import { useState, useEffect, useRef } from "react";

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
    edhrec_uri: card.related_uris?.edhrec ,
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
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark" ? "dark" : "light";
  });
  // Persist theme in localStorage
  useEffect(() => {
    document.body.className = theme === "dark" ? "theme-dark" : "theme-light";
    localStorage.setItem("theme", theme);
  }, [theme]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [colorInput, setColorInput] = useState("");
  const [commanders, setCommanders] = useState([]);
  const [randomCommander, setRandomCommander] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [favorites, setFavorites] = useState([]);

  // Prevent saving to localStorage on initial mount
  const didMount = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem("favorites");
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        setFavorites(parsed);
        console.log("Loaded favorites from localStorage:", parsed);
      } else {
        console.log("Favorites in localStorage are not an array:", parsed);
      }
    } catch (e) {
      console.log("Error parsing favorites from localStorage:", e);
    }
  }, []);

  useEffect(() => {
    if (didMount.current) {
      localStorage.setItem("favorites", JSON.stringify(favorites));
      console.log("Saved favorites to localStorage:", favorites);
    } else {
      didMount.current = true;
    }
  }, [favorites]);

  const handleInputChange = (e) => setColorInput(e.target.value);

  // Add commander to favorites
  const addFavorite = (commander) => {
    if (!favorites.some(fav => fav.name === commander.name)) {
      setFavorites([...favorites, commander]);
    }
  };

  // Remove commander from favorites
  const removeFavorite = (commander) => {
    setFavorites(favorites.filter(fav => fav.name !== commander.name));
  };

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
    <>
      {/* Header */}
      <header style={{ width: '100%', background: 'rgba(33,150,243,0.95)', color: '#fff', padding: '1.2em 0', marginBottom: '2em', boxShadow: '0 2px 8px rgba(33,150,243,0.12)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2em' }}>
          <h1 style={{ margin: 0, fontWeight: 700, fontSize: '2em', letterSpacing: '0.03em' }}>Commander Finder</h1>
          <span style={{ fontWeight: 600, fontSize: '1em', opacity: 0.8 }}>by Jagger</span>
        </div>
      </header>

      {/* Desktop Theme Slider */}
      <div className="header-actions-desktop">
        <div style={{ position: 'fixed', top: '1em', right: '1em', zIndex: 1200, display: 'flex', alignItems: 'center' }}>
          <label style={{ marginRight: '0.5em' }}>Theme:</label>
          <label className="theme-switch">
            <input
              type="checkbox"
              checked={theme === "dark"}
              onChange={() => setTheme(theme === "dark" ? "light" : "dark")}
              style={{ display: 'none' }}
            />
            <span className="slider"></span>
          </label>
          <span style={{ marginLeft: '0.5em' }}>{theme === "dark" ? "Dark" : "Light"}</span>
        </div>
        <button className="favorites-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ position: 'fixed', top: '1em', left: '1em', zIndex: 1200 }}>
          {sidebarOpen ? "Close Favorites" : `Favorites (${favorites.length})`}
        </button>
      </div>

      {/* Favorites Sidebar */}
      <div className={`favorites-sidebar${sidebarOpen ? " open" : ""}`}>
        <div className="favorites-list">
          <h2>Saved Favorites</h2>
          {favorites.length === 0 && <p>No favorites yet.</p>}
          {favorites.map((fav) => (
            <div key={fav.name} className="favorite-item">
              <a
                href={fav.edhrec_uri}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textAlign: 'center', width: '100%', textDecoration: 'none', color: 'inherit' }}
              >
                {fav.image && (
                  <img
                    src={fav.image}
                    alt={fav.name}
                  />
                )}
                <div style={{ marginTop: '0.5em', fontWeight: 'bold' }}>{fav.name}</div>
              </a>
              <button onClick={() => removeFavorite(fav)}>Remove</button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className={theme === "dark" ? "theme-dark main-content-box" : "theme-light main-content-box"} style={{ maxWidth: 900, margin: '1em auto', padding: '1em', borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}>
        <form style={{ margin: "0em 0", display: 'flex', flexDirection: 'column', gap: '1em' }}>
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
              href={randomCommander.edhrec_uri}
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
            <div style={{ marginTop: '1em' }}>
              {favorites.some(fav => fav.name === randomCommander.name) ? (
                <button onClick={() => removeFavorite(randomCommander)}>Remove from Favorites</button>
              ) : (
                <button onClick={() => addFavorite(randomCommander)}>Add to Favorites</button>
              )}
            </div>
          </div>
        )}
        {commanders.length > 0 && !randomCommander && (
          <div style={{ margin: '2em 0' }}>
            <h2>Possible Commanders</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1em' }}>
              {commanders.map((card) => (
                <div key={card.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '200px' }}>
                  <a
                    href={card.edhrec_uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textAlign: 'center', width: '100%', textDecoration: 'none', color: 'inherit' }}
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
                  <div style={{ marginTop: '0.5em' }}>
                    {favorites.some(fav => fav.name === card.name) ? (
                      <button onClick={() => removeFavorite(card)}>Remove from Favorites</button>
                    ) : (
                      <button onClick={() => addFavorite(card)}>Add to Favorites</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Favorites List moved to sidebar */}
      </div>

      {/* Footer */}
      <footer style={{ width: '100%', background: 'rgba(33,150,243,0.95)', color: '#fff', padding: '1em 0', marginTop: '2em', boxShadow: '0 -2px 8px rgba(33,150,243,0.12)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center', fontSize: '1em', opacity: 0.8 }}>
          &copy; {new Date().getFullYear()} Commander Finder by Jagger. All rights reserved.
        </div>
      </footer>
    </>
  );
}



export default App;
