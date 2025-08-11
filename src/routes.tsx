import React from "react";
import { Routes, Route } from "react-router-dom";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<div>Home</div>} />
      <Route path="/orders" element={<div>Orders placeholder</div>} />
    </Routes>
  );
}









