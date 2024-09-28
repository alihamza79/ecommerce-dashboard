// src/routes/AuthProtected.js
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { checkAuth } from "../appwrite/Services/authServices";

const AuthProtected = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      const isAuth = await checkAuth(); // Check if a session is valid
      setIsAuthenticated(isAuth);
      setLoading(false); // Stop loading after checking
    };

    verifyAuth(); // Run the authentication check on component mount
  }, []);

  if (loading) {
    return <div>Loading...</div>; // Display a loading message or spinner
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />; // Redirect to login if not authenticated
  }

  return children; // Render protected content if authenticated
};

export default AuthProtected;

