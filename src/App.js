import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import UnifiedGrid from "./UnifiedGrid";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<UnifiedGrid />} />
        <Route path="/sender" element={<UnifiedGrid />} />
        <Route path="/receiver" element={<UnifiedGrid />} />
      </Routes>
    </Router>
  );
}

export default App;