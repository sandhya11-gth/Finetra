
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
        <div className="auth-brand">finetra<span>.</span></div>
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

        <div className="auth-divider"><span>or continue with email</span></div>

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

        {message && <p className="auth-message" role="status">{message}</p>}

        <p className="auth-switch">
          {mode === "login" ? "New to Finetra?" : "Already have an account?"}
          {" "}
          <button onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setMessage("");
          }}>
            {mode === "login" ? "Create account" : "Sign in"}
          </button>
        </p>
      </section>
    </main>
  );
}
