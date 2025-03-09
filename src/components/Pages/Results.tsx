import { useState, useEffect } from "react";
import axios from 'axios';
import { ArrowLeft, FileText, Download, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import ChatBot from "./Chatbot.jsx";

export default function Results({files}) {
    const [loading, setLoading] = useState(true);
    const [analysis, setAnalysis] = useState({
        caption: "",
        conditions: {
            "Pneumonia": "80%",
            "Lung Abnormality": "90%"
        }
    });
    const navigate = useNavigate();

    useEffect(() => {
        // Try to get the caption from localStorage first (set by XrayDetect)
        const savedCaption = localStorage.getItem('xrayCaption');
        
        if (savedCaption) {
            setAnalysis(prev => ({
                ...prev,
                caption: savedCaption
            }));
            setLoading(false);
            return;
        }
        
        // If no saved caption, try to fetch from API
        axios.get('/api/caption')
            .then((res) => {
                if (res.data.success) {
                    setAnalysis({
                        caption: res.data.caption,
                        conditions: res.data.conditions || {
                            "Pneumonia": "80%",
                            "Lung Abnormality": "90%"
                        }
                    });
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching analysis:", err);
                // Fallback to default data for demo purposes
                setLoading(false);
            });
    }, []);

    const handleBack = () => {
        navigate('/');
    };

    // Function to render condition items with confidence levels
    //@ts-ignore
    const renderConditions = () => {
        if (!analysis.conditions || Object.keys(analysis.conditions).length === 0) {
            return <p className="text-gray-500 italic">No specific conditions identified</p>;
        }

        return (
            <div className="space-y-3 mt-4">
                {Object.entries(analysis.conditions).map(([condition, confidence]) => (
                    <div key={condition} className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                        <div className="flex items-center">
                            <div className="h-4 w-4 bg-green-600 rounded-full mr-2"></div>
                            <span className="font-medium">{condition}</span>
                        </div>
                        <span className="bg-green-200 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                            {confidence}
                        </span>
                    </div>
                ))}
            </div>
        );
    };

    // Function to format diagnostic text with proper sections
    const formatDiagnosticSummary = () => {
        // If no caption is available, return a default message
        if (!analysis.caption) {
            return (
                <p className="text-gray-700">
                    The patient is diagnosed with Pneumonia (80%) and Lung Abnormality (90%). 
                    No signs of Covid-19 detected. Further testing is recommended.
                </p>
            );
        }

        // If we have a caption but it seems to be raw text, format it properly
        const sections = [
            { title: "Findings", content: [] },
            { title: "Assessment", content: [] },
            { title: "Recommendations", content: [] }
        ];

        // Extract findings and format them as bullet points
        // This is a simplified parsing logic - you may need to adjust based on your actual data
        const rawText = analysis.caption;
        
        if (rawText.includes("**Findings:**")) {
            const findingsSection = rawText.split("**Findings:**")[1].split("**Assessment:**")[0];
            // Extract numbered findings
            const findings = findingsSection.match(/\d+\.\s+\*\*[^*]+\*\*[^0-9]*/g) || [];
            //@ts-ignore
            sections[0].content = findings.map(f => f.trim().replace(/^\d+\.\s+/, ''));
        }
        
        if (rawText.includes("**Assessment:**")) {
            const assessment = rawText.split("**Assessment:**")[1].split("**Recommendations:**")[0];
              //@ts-ignore
            sections[1].content.push(assessment.trim());
        }
        
        if (rawText.includes("**Recommendations:**")) {
            const recommendations = rawText.split("**Recommendations:**")[1].split("**Limitations:**")[0];
            // Extract numbered recommendations
            const recs = recommendations.match(/\d+\.\s+\*\*[^*]+\*\*[^0-9]*/g) || [];
              //@ts-ignore
            sections[2].content = recs.map(r => r.trim().replace(/^\d+\.\s+/, ''));
        }

        return (
            <div className="space-y-4">
                {sections.map((section, index) => (
                    <div key={index} className={section.content.length > 0 ? "mt-4" : "hidden"}>
                        <h3 className="text-lg font-bold text-green-700 mb-2">{section.title}</h3>
                        {section.content.length > 0 ? (
                            <ul className="list-disc pl-5 space-y-2">
                                {section.content.map((item, i) => (
                                    <li key={i} className="text-gray-700">
                                        
                                        {  //@ts-ignore
                                        
                                        item.replace(/\*\*/g, '')}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500 italic">No {section.title.toLowerCase()} available</p>
                        )}
                    </div>
                ))}
                
                {/* If no sections were populated, display the raw text with minimal formatting */}
                {sections.every(section => section.content.length === 0) && (
    <div className="prose max-w-none text-gray-700">
        {rawText.split('**').map((part, index) => 
            index % 2 === 1 ? (
                <strong key={index}>{part}</strong>
            ) : (
                <span key={index}>{part}</span>
            )
        )}
    </div>
)}
            </div>
        );
    };

    return (
        <div className="flex flex-col min-h-screen bg-green-50 text-gray-900">
            {/* Header */}
            <header className="sticky top-0 bg-green-700 text-white p-4 flex items-center shadow-md">
                <button 
                    className="p-2 rounded-lg hover:bg-green-800" 
                    aria-label="Go back"
                    onClick={handleBack}
                >
                    <ArrowLeft className="h-6 w-6" />
                </button>
                <h1 className="ml-4 text-xl font-bold">X-Ray Detection Result</h1>
                <div className="ml-auto flex gap-2">
                    <button className="p-2 rounded-lg hover:bg-green-800" aria-label="Download report">
                        <Download className="h-5 w-5" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-green-800" aria-label="Share results">
                        <Share2 className="h-5 w-5" />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-5xl mx-auto px-4 py-6 space-y-6">
                {/* Patient Info */}
                <div className="bg-white p-6 flex flex-wrap md:flex-nowrap gap-4 justify-between rounded-xl shadow">
                    <p className="text-lg"><strong>Patient ID:</strong> XR-2023-0542</p>
                    <p className="text-lg"><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                    <p className="text-amber-600"><strong>Status:</strong> AI Analysis Complete</p>
                </div>

                {/* X-Ray Image */}
                <div className="flex justify-center">
                    <div className="relative w-72 h-72 bg-gray-100 rounded-xl shadow flex items-center justify-center overflow-hidden">
                        <img
                            src={URL.createObjectURL(files[0])}
                            alt="X-ray image"
                            className="object-cover w-full h-full rounded-xl"
                            onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                        {files && files.length > 0 ? (
                            <img
                                src={URL.createObjectURL(files[0])}
                                alt="X-ray image"
                                className="object-cover w-full h-full rounded-xl"
                                onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                        ) : (
                            <p className="text-gray-400">No image available</p>
                        )}
                    </div>
                </div>
                {/* Chatbot Integration */}
                    <ChatBot />

                {/* Detection Results */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-bold text-green-800 border-b pb-2">Detection Results</h2>

                    {loading ? (
                        <div className="bg-white p-5 rounded-xl shadow flex justify-center items-center h-32">
                            <p className="text-gray-500">Loading analysis results...</p>
                        </div>
                    ) : (
                        <>
                            {/* Diagnostic Summary */}
                            <div className="bg-white p-5 rounded-xl shadow">
                                <h2 className="flex items-center text-xl font-bold text-green-800 mb-4">
                                    <FileText className="h-6 w-6 mr-2" /> Diagnostic Summary
                                </h2>
                                
                                {formatDiagnosticSummary()}
                            </div>
                        </>
                    )}
                </section>
            </main>

            {/* Footer */}
            <footer className="mt-auto py-4 text-center text-sm text-gray-500 border-t">
                <p>© 2025 XrayDetect. Results should be reviewed by a healthcare professional.</p>
            </footer>
        </div>
    );
}