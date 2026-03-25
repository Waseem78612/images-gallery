import { Routes, Route, Navigate } from "react-router-dom";
import RegisterPage from "./pages/RegisterPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import GalleryPage from "./pages/GalleryPage.jsx";
import { useAuth } from "./context/AuthContext.jsx";

// Loading spinner component
const Spinner = () => (
  <div className="min-h-screen bg-bg flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-500 text-sm">Verifying session…</p>
    </div>
  </div>
);

// Redirect authenticated users to gallery
const GuestRoute = ({ children }) => {
  const { token, loading } = useAuth();
  if (loading) return <Spinner />;
  return token ? <Navigate to="/gallery" replace /> : children;
};

// Redirect unauthenticated users to register
const ProtectedRoute = ({ children }) => {
  const { token, loading } = useAuth();
  if (loading) return <Spinner />;
  return token ? children : <Navigate to="/register" replace />;
};

export default function App() {
  return (
    <Routes>
      <Route index element={<Navigate to="/register" replace />} />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        }
      />
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />
      <Route
        path="/gallery"
        element={
          <ProtectedRoute>
            <GalleryPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/register" replace />} />
    </Routes>
  );
}
