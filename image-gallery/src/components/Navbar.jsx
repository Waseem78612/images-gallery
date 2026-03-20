import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-3">

        {/* Logo → gallery */}
        <Link to="/gallery"
          className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-accent-glow border border-accent/30
                          flex items-center justify-center text-base sm:text-lg transition-transform
                          duration-200 group-hover:scale-110">
            🖼️
          </div>
          <span className="font-display text-base sm:text-lg font-bold text-white group-hover:text-accent-light transition-colors">
            Image Gallery
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface border border-border">
              <div className="w-5 h-5 rounded-full bg-accent-glow border border-accent/40 flex items-center justify-center text-xs text-accent-light font-bold">
                {user.username?.[0]?.toUpperCase() || "U"}
              </div>
              <span className="text-xs text-gray-300 font-medium max-w-[120px] truncate">
                {user.username}
              </span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="text-xs font-medium text-gray-400 hover:text-red-400 border border-border hover:border-red-800/50 px-3 py-1.5 rounded-xl transition-all">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
