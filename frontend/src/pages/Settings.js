import { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Building2, MapPin, User, Mail } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Settings = () => {
  const [restaurant, setRestaurant] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    responsible_person: '',
    email: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRestaurantData();
  }, []);

  const fetchRestaurantData = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      const restaurantData = response.data.restaurant;
      setRestaurant(restaurantData);
      setFormData({
        name: restaurantData.name || '',
        address: restaurantData.address || '',
        responsible_person: restaurantData.responsible_person || '',
        email: restaurantData.email || ''
      });
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      toast.error('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await axios.put(`${API}/restaurant`, formData);
      toast.success('Restaurant-Daten erfolgreich aktualisiert!');
      
      // Update localStorage
      const updatedRestaurant = { ...restaurant, ...formData };
      localStorage.setItem('restaurant', JSON.stringify(updatedRestaurant));
      
      // Reload to update navigation
      window.location.reload();
    } catch (error) {
      console.error('Error updating restaurant:', error);
      toast.error('Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Einstellungen</h1>
          <p className="page-subtitle">Restaurant-Informationen verwalten</p>
        </div>
        <div>Lädt...</div>
      </div>
    );
  }

  return (
    <div className="page-container" data-testid="settings-page">
      <div className="page-header">
        <h1 className="page-title">Einstellungen</h1>
        <p className="page-subtitle">Restaurant-Informationen für PDF-Exporte</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              <Building2 size={18} />
              Restaurant Name
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Mein Restaurant"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              data-testid="restaurant-name-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <MapPin size={18} />
              Adresse
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Musterstraße 123, 10115 Berlin"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              data-testid="address-input"
            />
            <small style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
              Wird im PDF-Export angezeigt
            </small>
          </div>

          <div className="form-group">
            <label className="form-label">
              <User size={18} />
              Verantwortlicher
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Max Mustermann"
              value={formData.responsible_person}
              onChange={(e) => setFormData({ ...formData, responsible_person: e.target.value })}
              data-testid="responsible-input"
            />
            <small style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
              Name der verantwortlichen Person
            </small>
          </div>

          <div className="form-group">
            <label className="form-label">
              <Mail size={18} />
              Kontakt-Email
            </label>
            <input
              type="email"
              className="form-input"
              placeholder="kontakt@restaurant.de"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              data-testid="email-input"
            />
            <small style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
              Wird im PDF-Export angezeigt
            </small>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
            data-testid="save-button"
          >
            <Save size={18} />
            {saving ? 'Wird gespeichert...' : 'Änderungen speichern'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Settings;
