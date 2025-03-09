import { useEffect } from "react";
import AOS from "aos";

const Hero = () => {
  useEffect(() => {
    AOS.init(); // Ensure AOS initializes on mount
  }, []);
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-4xl font-bold text-blue-600" data-aos="fade-up">
        Welcome to My Vite + React + Tailwind Site!
      </h1>
      <p className="mt-4 text-lg text-gray-700" data-aos="fade-right">
        This is an example of using AOS in a Vite project.
      </p>
      <button className="mt-6 px-6 py-3 bg-blue-500 text-white rounded-lg shadow-lg" data-aos="zoom-in">
        Get Started
      </button>
    </div>
  );
};

export default Hero;