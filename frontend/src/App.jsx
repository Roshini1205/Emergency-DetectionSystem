import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import EmergencyDashboard from "./pages/EmergencyDashboard";
import Alert from "./pages/Alert";
import Settings from "./pages/Settings";
import Signup from "./pages/Signup";
import Signin from "./pages/Signin";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<EmergencyDashboard />} />
        <Route path="/alert" element={<Alert />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/signin" element={<Signin />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
