import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { setToken, setUser, setRestaurant } from '../utils/auth';
import { toast } from 'sonner';
import { UserPlus, Mail, Lock, Store } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    restaurant_name: '',
    restaurant_address: '',
    responsible_person: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/register`, formData);
      setToken(response.data.token);
      setUser(response.data.user);
      setRestaurant(response.data.restaurant);
      toast.success('Erfolgreich registriert!');
      navigate('/');
    } catch (error) {
      console.error('Register error:', error);
      toast.error(error.response?.data?.detail || 'Registrierung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" data-testid="register-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon">
            <UserPlus size={32} />
          </div>
          <h1 className="auth-title">Neues Restaurant</h1>
          <p className="auth-subtitle">Registrieren Sie Ihr Restaurant</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">
              <Store size={18} />
              Restaurant Name
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Mein Restaurant"
              value={formData.restaurant_name}
              onChange={(e) => setFormData({ ...formData, restaurant_name: e.target.value })}
              required
              data-testid="restaurant-name-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Adresse
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Musterstraße 123, 10115 Berlin"
              value={formData.restaurant_address}
              onChange={(e) => setFormData({ ...formData, restaurant_address: e.target.value })}
              data-testid="restaurant-address-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Verantwortlicher
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Max Mustermann"
              value={formData.responsible_person}
              onChange={(e) => setFormData({ ...formData, responsible_person: e.target.value })}
              data-testid="responsible-person-input"
            />
          </div>

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
              minLength={6}
              data-testid="password-input"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
            data-testid="register-button"
          >
            {loading ? 'Wird geladen...' : 'Registrieren'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Bereits registriert?{' '}
            <Link to="/login" className="auth-link" data-testid="login-link">
              Jetzt anmelden
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;