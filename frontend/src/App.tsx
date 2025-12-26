import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './Home';
import Host from './Host';
import Player from './Player';
import './index.css';

function App() {
  return (
    <Router>
      <div>
        <nav className="navbar-custom">
          <Link to="/" className="navbar-brand">Family Feud</Link>
        </nav>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/game/:code" element={<Player />} />
          <Route path="/game/:code/host" element={<Host />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
