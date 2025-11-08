import { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Checklist = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employeeInitials, setEmployeeInitials] = useState({});

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await axios.get(`${API}/items`);
      setItems(response.data);
      
      // Initialize empty initials for each item
      const initials = {};
      response.data.forEach(item => {
        initials[item.id] = '';
      });
      setEmployeeInitials(initials);
    } catch (error) {
      console.error('Error fetching items:', error);
      toast.error('Fehler beim Laden der Geräte');
    } finally {
      setLoading(false);
    }
  };

  const handleCheck = async (item) => {
    const initials = employeeInitials[item.id];
    
    if (!initials || !initials.trim()) {
      toast.error('Bitte geben Sie den Mitarbeiter-Namen ein');
      return;
    }

    try {
      await axios.post(`${API}/checks`, {
        item_id: item.id,
        item_name: item.name,
        employee_initials: initials.trim().toUpperCase()
      });
      toast.success(`${item.name} erfolgreich kontrolliert!`);
      
      // Clear the initials for this item after successful check
      setEmployeeInitials(prev => ({
        ...prev,
        [item.id]: ''
      }));
    } catch (error) {
      console.error('Error creating check:', error);
      toast.error('Fehler beim Speichern der Kontrolle');
    }
  };

  const handleInitialsChange = (itemId, value) => {
    setEmployeeInitials(prev => ({
      ...prev,
      [itemId]: value.toUpperCase()
    }));
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Checkliste</h1>
          <p className="page-subtitle">Reinigungskontrollen durchführen</p>
        </div>
        <div>Lädt...</div>
      </div>
    );
  }

  return (
    <div className="page-container" data-testid="checklist-page">
      <div className="page-header">
        <h1 className="page-title">Checkliste</h1>
        <p className="page-subtitle">Reinigungskontrollen durchführen - Jeder Mitarbeiter trägt sein Kürzel ein</p>
      </div>

      {items.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <AlertCircle size={48} />
            </div>
            <div className="empty-state-text">Keine Geräte/Bereiche vorhanden</div>
            <p style={{ color: '#9e9e9e', marginTop: '0.5rem' }}>Fügen Sie zuerst Geräte/Bereiche unter "Geräte" hinzu</p>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="checklist-grid">
            {items.map((item) => (
              <div key={item.id} className="checklist-item-card" data-testid="checklist-item">
                <div className="checklist-item-header">
                  <h3 className="checklist-item-name">{item.name}</h3>
                  <span className={`badge badge-${item.interval}`}>
                    {item.interval === 'daily' && 'Täglich'}
                    {item.interval === 'weekly' && 'Wöchentlich'}
                    {item.interval === 'monthly' && 'Monatlich'}
                  </span>
                </div>
                
                <div className="checklist-item-body">
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label" style={{ fontSize: '0.875rem' }}>Mitarbeiter-Kürzel</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="z.B. JD, MS, AK"
                      value={employeeInitials[item.id] || ''}
                      onChange={(e) => handleInitialsChange(item.id, e.target.value)}
                      maxLength={4}
                      data-testid={`initials-input-${item.id}`}
                    />
                  </div>
                  
                  <button
                    className="btn btn-primary btn-full"
                    onClick={() => handleCheck(item)}
                    disabled={!employeeInitials[item.id] || !employeeInitials[item.id].trim()}
                    data-testid={`check-button-${item.id}`}
                  >
                    <CheckCircle2 size={18} />
                    Kontrolliert
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Checklist;