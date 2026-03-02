import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import "../css/auth.css";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const routeByRole = (role) => {
    if (role === "superadmin") return "/superadmin";
    if (role === "admin") return "/admin";
    return "/member";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(routeByRole(user.role));
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-hero">
        <div className="auth-hero-circle-1" />
        <div className="auth-hero-circle-2" />
        <div className="auth-hero-inner">
          <div className="auth-hero-logo">M</div>
          <h1 className="auth-hero-title">
            Manage your
            <br />
            business smarter
          </h1>
          <p className="auth-hero-text">
            A powerful SaaS platform to manage clients, members, and revenue —
            all from one dashboard.
          </p>
          <div className="auth-hero-features">
            <div className="auth-hero-feature">
              <span className="auth-hero-feature-dot" />
              Role-based access control
            </div>
            <div className="auth-hero-feature">
              <span className="auth-hero-feature-dot" />
              Real-time analytics & reports
            </div>
            <div className="auth-hero-feature">
              <span className="auth-hero-feature-dot" />
              Multi-tenant data isolation
            </div>
          </div>
        </div>
      </div>

      <div className="auth-form-section">
        <div className="auth-card">
          <div className="auth-brand">
            <div className="auth-brand-icon">M</div>
            <h1 className="auth-brand-title">Welcome back</h1>
            <p className="auth-brand-subtitle">
              Sign in to your Micro SaaS account
            </p>
          </div>

          <form className="auth-form" onSubmit={onSubmit}>
            <div className="auth-field">
              <label className="auth-label" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="auth-input"
                placeholder="you@company.com"
                value={form.email}
                onChange={onChange}
                required
              />
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="password">
                Password
              </label>
              <div className="auth-password-wrapper">
                <input
                  id="password"
                  name="password"
                  type={showPw ? "text" : "password"}
                  className="auth-input"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={onChange}
                  required
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button
              type="submit"
              className="auth-submit-button"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
