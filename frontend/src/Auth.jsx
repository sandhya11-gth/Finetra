
import { useState } from "react";
import { supabase } from "./supabase";
import "./Auth.css";

export default function Auth() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleEmailAuth(event) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const result =
        mode === "signup"
          ? await supabase.auth.signUp({ email, password })
          : await supabase.auth.signInWithPassword({ email, password });

      if (result.error) throw result.error;

      if (mode === "signup" && !result.data.session) {
        setMessage("Check your email to confirm your account.");
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setMessage("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) setMessage(error.message);
  }

  return (
    <main className="auth-page">
      <section className="auth-card">

        {/* Finetra Brand */}
        <div className="auth-brand">
          <div className="auth-logo">
            <svg viewBox="0 0 52 52" aria-hidden="true">
              <defs>
                <linearGradient id="authFTop" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#D9FF38" />
                  <stop offset="100%" stopColor="#A7E52E" />
                </linearGradient>
                <linearGradient id="authFMid" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#C5F342" />
                  <stop offset="100%" stopColor="#7B5BFF" />
                </linearGradient>
                <linearGradient id="authFBottom" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#D15CFF" />
                  <stop offset="100%" stopColor="#875BFF" />
                </linearGradient>
              </defs>

              <path
                d="M13.5 9C15.5 6.1 18.7 4.5 22.4 4.5H46L39.2 13.8H16.8C13.6 13.8 11.4 12 13.5 9Z"
                fill="url(#authFTop)"
              />
              <path
                d="M10.5 21.5C12.6 18.5 15.8 16.8 19.5 16.8H39.5L32.7 26H13.8C10.5 26 8.3 24.6 10.5 21.5Z"
                fill="url(#authFMid)"
              />
              <path
                d="M6.7 34.2C8.8 31.2 11.8 29.5 15.4 29.5H27.5L20.6 38.8H9.8C6.5 38.8 4.5 37.4 6.7 34.2Z"
                fill="url(#authFBottom)"
              />
            </svg>
          </div>

          <span className="auth-brand-name">
            finetra<span className="auth-brand-dot">.</span>
          </span>
        </div>

        <p className="auth-eyebrow">YOUR FINANCIAL SPACE</p>

        <h1>{mode === "login" ? "Welcome back." : "A clearer start."}</h1>

        <p className="auth-subtitle">
          {mode === "login"
            ? "Sign in to continue your money story."
            : "Create an account for your financial space."}
        </p>

        <button className="auth-google" onClick={handleGoogleLogin}>
          Continue with Google
        </button>

        <div className="auth-divider">
          <span>or continue with email</span>
        </div>

        <form onSubmit={handleEmailAuth} className="auth-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              minLength={6}
              required
            />
          </label>

          <button className="auth-submit" disabled={loading}>
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        {message && (
          <p className="auth-message" role="status">
            {message}
          </p>
        )}

        <p className="auth-switch">
          {mode === "login"
            ? "New to Finetra?"
            : "Already have an account?"}
          {" "}
          <button
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setMessage("");
            }}
          >
            {mode === "login" ? "Create account" : "Sign in"}
          </button>
        </p>
      </section>
    </main>
  );
}
