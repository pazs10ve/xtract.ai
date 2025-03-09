import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import AOS from "aos";
import "aos/dist/aos.css";
// Initialize AOS
AOS.init({
  duration: 1000, // Animation duration
  easing: "ease-in-out", // Smooth easing
  once: true, // Animation runs only once
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
