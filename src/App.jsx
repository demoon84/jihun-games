import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ProjectManager from './pages/ProjectManager';
import DefenseGame from './games/defense/DefenseGame';
import ZombieGame from './games/zombie/ZombieGame';
import BaseballGame from './games/baseball/BaseballGame';
import ProverbGame from './games/proverb/ProverbGame';

function normalizeRoutePath(rawValue) {
    const raw = String(rawValue || '').trim();
    if (!raw) {
        return '';
    }

    const prefixed = raw.startsWith('/') ? raw : `/${raw}`;
    return prefixed
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9/_-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/\/+/g, '/');
}

const DEPLOY_GAME_ROUTE_MAP = {
    '/defense': DefenseGame,
    '/zombie': ZombieGame,
    '/baseball': BaseballGame,
    '/proverb': ProverbGame,
};

function App() {
    const deployGameRoute = normalizeRoutePath(import.meta.env.VITE_DEPLOY_GAME_PATH);
    const DeployGame = DEPLOY_GAME_ROUTE_MAP[deployGameRoute];

    if (DeployGame) {
        return (
            <Router>
                <Routes>
                    <Route path="*" element={<DeployGame />} />
                </Routes>
            </Router>
        );
    }

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
