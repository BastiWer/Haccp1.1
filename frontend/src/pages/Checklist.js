import { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Checklist = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employeeInitials, setEmployeeInitials] = useState('');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await axios.get(`${API}/items`);
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching items:', error);
      toast.error('Fehler beim Laden der Geräte');
    } finally {
      setLoading(false);
    }
  };

  const handleCheck = async (item) => {
    if (!employeeInitials.trim()) {
      toast.error('Bitte geben Sie Ihr Mitarbeiter-Kürzel ein');
      return;
    }

    try {
      await axios.post(`${API}/checks`, {
        item_id: item.id,
        item_name: item.name,
        employee_initials: employeeInitials.trim().toUpperCase()
      });
      toast.success(`${item.name} erfolgreich kontrolliert!`);
    } catch (error) {
      console.error('Error creating check:', error);
      toast.error('Fehler beim Speichern der Kontrolle');
    }
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
        <p className="page-subtitle">Reinigungskontrollen durchführen</p>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="form-group">
          <label className="form-label">Mitarbeiter-Kürzel</label>
          <input
            type="text"
            className="form-input"
            placeholder="z.B. JD, MS, AK"
            value={employeeInitials}
            onChange={(e) => setEmployeeInitials(e.target.value.toUpperCase())}
            maxLength={4}
            data-testid="employee-initials-input"
          />
        </div>
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
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Gerät/Bereich</th>
                  <th>Intervall</th>
                  <th>Aktion</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} data-testid="checklist-item">
                    <td>{item.name}</td>
                    <td>
                      <span className={`badge badge-${item.interval}`}>
                        {item.interval === 'daily' && 'Täglich'}
                        {item.interval === 'weekly' && 'Wöchentlich'}
                        {item.interval === 'monthly' && 'Monatlich'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-primary"
                        onClick={() => handleCheck(item)}
                        disabled={!employeeInitials.trim()}
                        data-testid={`check-button-${item.id}`}
                      >
                        <CheckCircle2 size={18} />
                        Kontrolliert
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checklist;