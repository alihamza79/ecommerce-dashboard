import { account } from "../config";
import db from './dbServices'; // Make sure this path is correct
import { Query } from "appwrite";
export async function registerUser(username, email, password) {
  const user = await account.create("unique()", email, password, username);
  localStorage.setItem("authToken", user.$id);
  return user;
}


export const signIn = async (email, password) => {
  try {
    // Check if the user exists in the 'Users' collection by matching userId with the provided email
    const users = await db.Users.list([Query.equal('email', email)]);

    // Check if the user is restricted or should not be allowed to log in
    if (users.total > 0) {
      const existingUser = users.documents[0];
      if (existingUser.userId) { // Check based on userId or any other logic
        throw new Error("User is not allowed to log in.");
      }
    }

    // If the check passes, proceed to create the session
    const session = await account.createEmailPasswordSession(email, password);

    // Store the session ID in localStorage
    localStorage.setItem("authToken", session.$id); 
    return session;

  } catch (error) {
    console.error("Login error:", error); // Log the error details
    throw error; // Re-throw the error to handle it in the calling function
  }
};


export const signOutUser = async () => {
  try {
    await account.deleteSession('current');
    localStorage.removeItem("authToken");
  } catch (error) {
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    const user = await account.get();
    return user;
  } catch (error) {
    throw error;
  }
};

export const checkAuth = async () => {
  try {
    await account.get(); // If this doesn't throw an error, the user is authenticated
    return true;
  } catch (error) {
    return false;
  }
};

export const sendPasswordRecoveryEmail = async (email) => {
  const resetPasswordUrl = `${window.location.origin}/reset-password`; // Automatically construct URL
  try {
    await account.createRecovery(email, resetPasswordUrl);
  } catch (error) {
    throw error;
  }
};