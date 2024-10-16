// src/routes/AuthProtected.js

import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { checkAuth } from "../appwrite/Services/authServices";

const AuthProtected = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); // Loading state

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        setLoading(true); // Start loading
        const isAuth = await checkAuth(); // Check if a session is valid
        setIsAuthenticated(isAuth);
      } catch (error) {
        console.error("Authentication check failed:", error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false); // Stop loading after checking
      }
    };

    verifyAuth(); // Run the authentication check on component mount
  }, []);

  if (loading) {
    // Display the loading indicator with "Authenticating"
    return (
      <div className="py-4 text-center">
        <div>
          <lord-icon
            src="https://cdn.lordicon.com/msoeawqm.json"
            trigger="loop"
            colors="primary:#405189,secondary:#0ab39c"
            style={{ width: "72px", height: "72px" }}
          ></lord-icon>
        </div>
        <div className="mt-4">
          <h5>Authenticating...</h5>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />; // Redirect to login if not authenticated
  }

  return children; // Render protected content if authenticated
};

export default AuthProtected;
