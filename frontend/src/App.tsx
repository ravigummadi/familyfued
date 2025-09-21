import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Admin from './Admin';
import Player from './Player';
import { Navbar, Nav } from 'react-bootstrap';

function App() {
  return (
    <Router>
      <div>
        <Navbar bg="dark" variant="dark">
          <Navbar.Brand as={Link} to="/">Family Feud</Navbar.Brand>
          <Nav className="mr-auto">
            <Nav.Link as={Link} to="/">Game</Nav.Link>
            <Nav.Link as={Link} to="/admin">Admin</Nav.Link>
          </Nav>
        </Navbar>
        <Routes>
          <Route path="/admin" element={<Admin />} />
          <Route path="/" element={<Player />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

