import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from '../../pages/Home';
import { DynamicGameRoute, dynamicGameRouteDefs } from '../shared/dynamicGameRoutes';

export default function GameApp() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/games" element={<Home />} />
        {dynamicGameRouteDefs.map((gameRoute) => (
          <Route
            key={gameRoute.path}
            path={gameRoute.path}
            element={<DynamicGameRoute routePath={gameRoute.path} loadEntry={gameRoute.loadEntry} />}
          />
        ))}
        <Route path="*" element={<Home />} />
      </Routes>
    </Router>
  );
}
