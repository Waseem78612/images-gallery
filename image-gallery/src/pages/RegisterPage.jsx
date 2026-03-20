import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const { login, API } = useAuth();
  const navigate = useNavigate();

  const [form,    setForm]    = useState({ username: "", email: "", password: "" });
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!form.username.trim() || !form.email.trim() || !form.password) {
      setError("All fields are required."); return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters."); return;
    }
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/user/register`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ username: form.username.trim(), email: form.email.trim(), password: form.password }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message || "Registration failed."); return; }
      setSuccess(`Welcome, ${data.user.username}! Taking you to your gallery…`);
      setTimeout(() => { login(data.token, data.user); navigate("/gallery"); }, 1500);
    } catch {
      setError("Cannot connect to server. Make sure the server is running on port 3000.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Orbs */}
      <div className="orb w-72 h-72 sm:w-[420px] sm:h-[420px] bg-indigo-950/30 top-[-8rem] left-[-8rem]" />
      <div className="orb w-60 h-60 sm:w-80 sm:h-80  bg-violet-950/20  bottom-[-6rem] right-[-6rem]" />

      <div className="relative z-10 w-full max-w-md"
        style={{ animation: "fadeUp 0.45s cubic-bezier(0.4,0,0.2,1) both" }}>

        {/* Brand */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-accent-glow border border-accent/30 mb-4 text-2xl sm:text-3xl">
            🖼️
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Create Account
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1 font-body">
            Register to start uploading and managing images
          </p>
        </div>

        {/* Card */}
        <div className="glass-card glow-border p-5 sm:p-8">
          {error && (
            <div className="mb-4 px-3 sm:px-4 py-3 rounded-xl bg-red-950/50 border border-red-800/50 text-red-300 text-xs sm:text-sm flex items-start gap-2">
              <span className="shrink-0 mt-0.5">⚠️</span><span>{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-4 px-3 sm:px-4 py-3 rounded-xl bg-green-950/50 border border-green-800/50 text-green-300 text-xs sm:text-sm flex items-start gap-2">
              <span className="shrink-0 mt-0.5">✅</span><span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5">Username</label>
              <input name="username" type="text" placeholder="e.g. john_doe"
                value={form.username} onChange={handleChange}
                className="input-field" autoComplete="username"
                disabled={loading || !!success} />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5">Email address</label>
              <input name="email" type="email" placeholder="you@example.com"
                value={form.email} onChange={handleChange}
                className="input-field" autoComplete="email"
                disabled={loading || !!success} />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <input name="password" type="password" placeholder="min. 6 characters"
                value={form.password} onChange={handleChange}
                className="input-field" autoComplete="new-password"
                disabled={loading || !!success} />
            </div>

            <button type="submit" disabled={loading || !!success} className="btn-primary w-full mt-1">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating account…</>
                : success ? <>✅ Redirecting…</>
                : <>Create Account →</>}
            </button>
          </form>

          <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-border">
            <p className="text-center text-xs sm:text-sm text-gray-400 mb-3">
              Already have an account?
            </p>
            <Link to="/login"
              className="flex items-center justify-center w-full gap-2 py-2.5 sm:py-3 rounded-xl border border-accent/40 text-accent-light hover:bg-accent-glow hover:border-accent/70 transition-all duration-200 font-medium text-xs sm:text-sm">
              Sign In →
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-gray-700 mt-4 sm:mt-5 font-body">
          🖼️ Image Gallery — Upload · Compress · Manage
        </p>
      </div>
    </div>
  );
}
