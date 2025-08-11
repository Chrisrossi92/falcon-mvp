import React from "react";
import { Routes, Route } from "react-router-dom";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<div style={{ padding: 16 }}>Home OK</div>} />
    </Routes>
  );
}




