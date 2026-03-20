import { Routes, Route, Navigate } from "react-router-dom";
import RegisterPage from "./pages/RegisterPage.jsx";
import LoginPage    from "./pages/LoginPage.jsx";
import GalleryPage  from "./pages/GalleryPage.jsx";
import { useAuth }  from "./context/AuthContext.jsx";

function Spinner() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm font-body">Verifying session…</p>
      </div>
    </div>
  );
}

/* Logged-in users skip auth pages → go straight to gallery */
function GuestRoute({ children }) {
  const { token, loading } = useAuth();
  if (loading) return <Spinner />;
  return token ? <Navigate to="/gallery" replace /> : children;
}

/* Guests must register/login first */
function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();
  if (loading) return <Spinner />;
  return token ? children : <Navigate to="/register" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Root → register (first page) */}
      <Route index element={<Navigate to="/register" replace />} />

      {/* Public */}
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
      <Route path="/login"    element={<GuestRoute><LoginPage    /></GuestRoute>} />

      {/* Protected */}
      <Route path="/gallery"  element={<ProtectedRoute><GalleryPage /></ProtectedRoute>} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/register" replace />} />
    </Routes>
  );
}
