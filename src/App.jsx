import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ProjectManager from './pages/ProjectManager';
import DefenseGame from './games/defense/DefenseGame';
import ZombieGame from './games/zombie/ZombieGame';
import BaseballGame from './games/baseball/BaseballGame';
import ProverbGame from './games/proverb/ProverbGame';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<ProjectManager />} />
                <Route path="/manager" element={<ProjectManager />} />
                <Route path="/games" element={<Home />} />
                <Route path="/defense" element={<DefenseGame />} />
                <Route path="/zombie" element={<ZombieGame />} />
                <Route path="/baseball" element={<BaseballGame />} />
                <Route path="/proverb" element={<ProverbGame />} />
                <Route path="*" element={<ProjectManager />} />
            </Routes>
        </Router>
    );
}

export default App;
