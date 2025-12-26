import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './Home';
import Host from './Host';
import Player from './Player';
import Display from './Display';
import './index.css';

// Wrapper to conditionally show navbar (hide for TV display mode)
function AppContent() {
  const location = useLocation();
  const isDisplayMode = location.pathname.endsWith('/display');

  return (
    <div>
      {!isDisplayMode && (
        <nav className="navbar-custom">
          <Link to="/" className="navbar-brand">Family Feud</Link>
        </nav>
      )}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/game/:code" element={<Player />} />
        <Route path="/game/:code/host" element={<Host />} />
        <Route path="/game/:code/display" element={<Display />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;

