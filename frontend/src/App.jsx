import { useState, useEffect } from "react";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));

  // Optional: Add an effect to listen for token changes if needed across tabs
  useEffect(() => {
    const checkToken = () => {
      setIsLoggedIn(!!localStorage.getItem("token"));
    };
    
    window.addEventListener("storage", checkToken);
    return () => window.removeEventListener("storage", checkToken);
  }, []);

  return isLoggedIn ? (
    <Dashboard setIsLoggedIn={setIsLoggedIn} />
  ) : (
    <AuthPage setIsLoggedIn={setIsLoggedIn} />
  );
}

export default App;
