import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Mail, User, CheckCircle, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const nav = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [authStatus, setAuthStatus] = useState("idle");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  // Handle input change
    //@ts-ignore
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission
    //@ts-ignore
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthStatus("idle");

    const endpoint = activeTab === "login" ? "http://localhost:5003/login" : "http://localhost:5003/signup";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      setIsLoading(false);

      if (response.ok) {
        setAuthStatus("success");
        localStorage.setItem("token", data.token);
        setTimeout(() => {
          setAuthStatus("idle");
          nav("/upload");
        }, 2000);
      } else {
        setAuthStatus("error");
      }
    } catch (error) {
      console.error("Error:", error);
      setIsLoading(false);
      setAuthStatus("error");
    }
  };

  return (
    <div className="flex min-h-screen flex-col-reverse md:flex-row bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Form Section */}
      <motion.div className="flex w-full items-center justify-center p-6 md:w-1/2" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
        <motion.div className="w-full max-w-md bg-white p-8 rounded-xl shadow-xl">
          <div className="relative">
            {/* Tabs */}
            <div className="grid w-full grid-cols-2 mb-8 border-b">
              <button onClick={() => setActiveTab("login")} className={`p-3 text-lg font-medium transition duration-300 ${activeTab === "login" ? "text-emerald-600" : "text-gray-500 hover:text-gray-700"}`}>Login</button>
              <button onClick={() => setActiveTab("signup")} className={`p-3 text-lg font-medium transition duration-300 ${activeTab === "signup" ? "text-emerald-600" : "text-gray-500 hover:text-gray-700"}`}>Sign Up</button>
            </div>

            {/* Status Messages */}
            <AnimatePresence>
              {authStatus === "success" && (
                <motion.div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  {activeTab === "login" ? "Successfully logged in!" : "Account created successfully!"}
                </motion.div>
              )}
              {authStatus === "error" && (
                <motion.div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  {activeTab === "login" ? "Invalid credentials." : "Error creating account."}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Forms */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {activeTab === "signup" && (
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} className="pl-10 w-full border p-3 rounded-lg focus:ring-emerald-400" required />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input type="email" name="email" placeholder="name@example.com" value={formData.email} onChange={handleChange} className="pl-10 w-full border p-3 rounded-lg focus:ring-emerald-400" required />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input type="password" name="password" placeholder="••••••••" value={formData.password} onChange={handleChange} className="pl-10 w-full border p-3 rounded-lg focus:ring-emerald-400" required />
              </div>

              <button type="submit" className="w-full bg-emerald-500 text-white p-3 rounded-lg font-medium hover:bg-emerald-600 transition disabled:opacity-50" disabled={isLoading}>
                {isLoading ? "Processing..." : activeTab === "login" ? "Login" : "Sign Up"}
              </button>
            </form>
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        className="relative flex w-full items-center justify-center bg-gradient-to-br from-emerald-50 via-green-100 to-emerald-200 p-6 md:w-1/2"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative text-center max-w-md">
          <motion.img
            src="https://res.cloudinary.com/dveqjb2e7/image/upload/v1741089155/nyskkbkrjvlj8xpnwrwb.jpg"
            alt="X-ray AI Detection"
            className="rounded-xl shadow-2xl mb-6 border-4 border-white"
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.3 }}
          />
          <h2 className="text-2xl font-bold text-gray-800">Welcome to Our Platform</h2>
          <p className="text-gray-600 mt-2">Sign up or log in to access the features.</p>
        </div>
      </motion.div>
    </div>
  );
}
