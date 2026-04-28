// Import React hooks for state management and context
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

// Create authentication context object (initially null)
// This will be used to share auth state across the app
const AuthContext = createContext(null);

// AuthProvider component - wraps the app to provide auth functionality
export function AuthProvider({ children }) {
  // State for storing current user data (null = not logged in)
  const [user, setUser] = useState(null);

  // State for storing JWT token (initialize from localStorage if exists)
  // Uses lazy initialization to read localStorage only once
  const [token, setToken] = useState(
    () => localStorage.getItem("ig_token") || null,
  );

  // State for tracking authentication loading status (shows while checking token)
  const [loading, setLoading] = useState(true);

  // Validate token on component mount - checks if stored token is still valid
  useEffect(() => {
    // If no token exists, stop loading and exit
    if (!token) {
      setLoading(false);
      return;
    }

    // Fetch current user data using stored token
    // Using relative path because Vite proxy handles it
    fetch("/api/user/me", {
      headers: { Authorization: `Bearer ${token}` }, // Attach token in Authorization header
    })
      .then((r) => r.json()) // Parse response as JSON
      .then((data) => {
        // If token is valid (data.success = true), set user data
        // Otherwise, token is invalid - logout to clear it
        if (data.success) {
          setUser(data.user);
        } else {
          logout();
        }
      })
      .catch(() => logout()) // On network error, also logout
      .finally(() => setLoading(false)); // Always stop loading regardless of outcome
  }, [token]); // Re-run when token changes

  // Login function - stores token and user data
  const login = (tok, userData) => {
    localStorage.setItem("ig_token", tok); // Persist token to localStorage
    setToken(tok); // Update token state
    setUser(userData); // Update user state
  };

  // Logout function - clears all auth data
  const logout = () => {
    localStorage.removeItem("ig_token"); // Remove token from localStorage
    setToken(null); // Clear token state
    setUser(null); // Clear user state
  };

  // Authenticated fetch wrapper - automatically attaches Bearer token to requests
  // useCallback prevents recreation of this function on every render
  const authFetch = useCallback(
    (url, options = {}) => {
      // Copy existing headers to avoid mutation
      const headers = { ...options.headers };

      // If token exists, add Authorization header
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // Make fetch request with relative URL (Vite proxy will handle it)
      return fetch(url, { ...options, headers });
    },
    [token], // Only recreate if token changes
  );

  // Provide auth context value to all children components
  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, logout, authFetch }}
    >
      {children} {/* Render child components that can now use auth */}
    </AuthContext.Provider>
  );
}

// Custom hook to easily access auth context anywhere in the app
export const useAuth = () => useContext(AuthContext);
