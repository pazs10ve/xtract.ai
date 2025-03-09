import { useState } from "react";
import { Upload, FileX, AlertCircle } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import ChatBot from "./Chatbot.jsx";



export default function XrayDetect({setFiles,files}) {
 
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);

  const navigate = useNavigate();
    //@ts-ignore

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    validateAndSetFiles(droppedFiles);
  };
    //@ts-ignore

  const handleChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    validateAndSetFiles(selectedFiles);
  };
//@ts-ignore
  const validateAndSetFiles = (fileList) => {
    setError("");
    // Only allow image files
    //@ts-ignore
    const imageFiles = fileList.filter((file) =>
      file.type.startsWith("image/")
    );

    if (imageFiles.length !== fileList.length) {
      setError("Please upload only image files");
    }

    // Limit to one file for simplicity
    //@ts-ignore
    setFiles((prevFiles) => [...prevFiles, ...imageFiles].slice(0, 1));
  };
//@ts-ignore
  const removeFile = (index) => {
      //@ts-ignore
    setFiles(files.filter((_, i) => i !== index));
  };

  const simulateProgress = () => {
    // Simulate progress for better UX
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + Math.random() * 5;
        if (newProgress >= 100) {
          clearInterval(interval);
          return 100;
        }
        return newProgress;
      });
    }, 200);

    return () => clearInterval(interval);
  };

  const handleUpload = () => {
    if (files.length === 0) return;

    setUploading(true);
    setProgress(0);
    setError("");

    // Start progress simulation
    //@ts-ignore
    const clearProgressSimulation = simulateProgress();

    const formData = new FormData();
    formData.append("image", files[0]); // Change "file" to "image" to match the backend API

    // Use the correct API endpoint from your app.py file
    axios
      .post("http://localhost:5000/api/caption", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((res) => {
        console.log("Fallback successful:", res.data);
        if (res.data && res.data.caption) {
          localStorage.setItem("xrayCaption", res.data.caption); // Save caption to localStorage
        }
        setProgress(100);
        setTimeout(() => {
          setUploading(false);
          navigate("/results");
        }, 500);
      })
      .catch((fallbackErr) => {
        console.error("Fallback also failed:", fallbackErr);
        setError("Failed to process the image. Please try again.");
        setUploading(false);
        setProgress(0);
      });
  }; // Closing parenthesis for handleUpload function

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 text-gray-800">
      <header className="bg-gray-900 text-white p-6 text-center text-2xl font-bold shadow-md">
        XrayDetect
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
          <h2 className="text-2xl font-semibold text-center mb-6">Upload X-ray Image</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}
          
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
              uploading ? "bg-gray-100 border-gray-300" : "hover:border-green-500 hover:bg-green-50 border-gray-300"
            }`}
            onDrop={!uploading ? handleDrop : undefined}
            onDragOver={!uploading ? (e) => e.preventDefault() : undefined}
          >
            <Upload className="w-14 h-14 text-green-500 mx-auto" />
            <p className="text-gray-500 mt-2">Drag & Drop or</p>
            <label className={`bg-green-500 text-white px-5 py-2 rounded-lg cursor-pointer inline-block mt-3 transition hover:bg-green-600 ${
              uploading ? "opacity-50 cursor-not-allowed" : ""
            }`}>
              Browse
              <input 
                type="file" 
                className="hidden" 
                onChange={handleChange} 
                accept="image/*"
                disabled={uploading}
              />
            </label>
          </div>

          {files.length > 0 && (
            <ul className="mt-4 space-y-2">
            
              {
                  //@ts-ignore
              
              files.map((file, index) => (
                <li key={index} className="flex justify-between items-center p-3 bg-gray-200 rounded-lg shadow-sm">
                  <span className="text-sm font-medium truncate w-3/4">{file.name}</span>
                  {!uploading && (
                    <button 
                      onClick={() => removeFile(index)} 
                      className="text-red-500 hover:text-red-700 transition"
                    >
                      <FileX size={20} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {uploading && (
            <div className="mt-4">
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-center mt-2 text-sm text-gray-600">
                Analyzing X-ray image... {Math.round(progress)}%
              </p>
            </div>
          )}

          {files.length > 0 && !uploading && (
            <button
              onClick={handleUpload}
              className="mt-4 w-full py-2 rounded-lg text-white font-semibold transition bg-green-500 hover:bg-green-600"
            >
              Analyze X-ray
            </button>
          )}
          {/* Chatbot Integration */}
            <ChatBot />
          {/* Debug button for development - remove in production */}
          <button 
            onClick={() => navigate('/results')}
            className="mt-4 w-full py-2 rounded-lg text-white font-semibold transition bg-gray-500 hover:bg-gray-600 text-sm"
          >
            Debug: Skip to Results
          </button>
        </div>
      </main>

      <footer className="bg-gray-900 text-white p-5 text-center text-sm rounded-t-lg shadow-md">
        &copy; 2025 XrayDetect. All rights reserved.
      </footer>
    </div>
    
  );
} 