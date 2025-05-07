import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Index: React.FC = () => {
  const [showAuth, setShowAuth] = useState(false);
  const navigate = useNavigate();

  const handleLogin = () => {
    setShowAuth(true);
    // Simulate successful login and redirect to dashboard
    navigate("/dashboard");
  };

  return (
    <div>
      <h1>Welcome to FamiRoots</h1>
      <button onClick={handleLogin}>Login</button>
      {showAuth && <p>Authenticating...</p>}
    </div>
  );
};

export default Index;