import Login from "./components/Pages/Login.tsx";
import Results from "./components/Pages/Results.tsx";
import XrayDetect from "./components/Pages/XrayDetect.tsx";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Homepage from "./pages/homepage";
import React from "react";

function App() {
  const [files, setFiles] = React.useState([]);

  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/login" element={<Login />} />

          
          
          <Route path="/results" element={<Results files={files} />} />
          <Route
            path="/upload"
            element={<XrayDetect setFiles={setFiles} files={files} />}
          />
        </Routes>
      </Router>
    </>
  );
}

export default App;
