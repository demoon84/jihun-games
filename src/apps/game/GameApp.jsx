import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from '../../pages/Home';
import DefenseGame from '../../games/defense/DefenseGame';
import ZombieGame from '../../games/zombie/ZombieGame';
import BaseballGame from '../../games/baseball/BaseballGame';
import ProverbGame from '../../games/proverb/ProverbGame';

export default function GameApp() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/games" element={<Home />} />
        <Route path="/defense" element={<DefenseGame />} />
        <Route path="/zombie" element={<ZombieGame />} />
        <Route path="/baseball" element={<BaseballGame />} />
        <Route path="/proverb" element={<ProverbGame />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </Router>
  );
}
