import React from "react";
import { useAuth } from "../../context/AuthContext";
import { Navigate } from "react-router-dom";

const Login: React.FC = () => {
  const { isAuthenticated, loading, login } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  return (
    <div className="login-page">
      <h1>ECS QR Generator</h1>
      <p>Please sign in with your ecsbr.com account to continue</p>
      <button onClick={login}>Sign in with Microsoft</button>
    </div>
  );
};

export default Login;
