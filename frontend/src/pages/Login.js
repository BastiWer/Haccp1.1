import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { setToken, setUser, setRestaurant } from '../utils/auth';
import { toast } from 'sonner';
import { LogIn, Mail, Lock } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, formData);
      setToken(response.data.token);
      setUser(response.data.user);
      setRestaurant(response.data.restaurant);
      toast.success('Erfolgreich eingeloggt!');
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.detail || 'Login fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" data-testid="login-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon">
            <LogIn size={32} />
          </div>
          <h1 className="auth-title">HACCP Kontrolle</h1>
          <p className="auth-subtitle">Anmelden bei Ihrem Restaurant</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">
              <Mail size={18} />
              Email
            </label>
            <input
              type="email"
              className="form-input"
              placeholder="ihre@email.de"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              data-testid="email-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <Lock size={18} />
              Passwort
            </label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              data-testid="password-input"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
            data-testid="login-button"
          >
            {loading ? 'Wird geladen...' : 'Anmelden'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Noch kein Konto?{' '}
            <Link to="/register" className="auth-link" data-testid="register-link">
              Jetzt registrieren
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;