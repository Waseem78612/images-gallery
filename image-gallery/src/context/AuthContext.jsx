import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(
    () => localStorage.getItem("ig_token") || null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    fetch(`api/user/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setUser(data.user);
        else logout();
      })
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  const login = (tok, userData) => {
    localStorage.setItem("ig_token", tok);
    setToken(tok);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("ig_token");
    setToken(null);
    setUser(null);
  };

  /* Authenticated fetch — attaches Bearer token automatically */
  const authFetch = useCallback(
    (url, options = {}) => {
      const headers = { ...options.headers };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      return fetch(`${API}${url}`, { ...options, headers });
    },
    [API, token],
  );

  return (
    <AuthContext.Provider
      value={{ user, token, loading, API, login, logout, authFetch }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
