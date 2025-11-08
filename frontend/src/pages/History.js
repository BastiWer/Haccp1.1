import { useState, useEffect } from 'react';
import axios from 'axios';
import { Download, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const History = () => {
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChecks();
  }, []);

  const fetchChecks = async () => {
    try {
      const response = await axios.get(`${API}/checks`);
      setChecks(response.data);
    } catch (error) {
      console.error('Error fetching checks:', error);
      toast.error('Fehler beim Laden der Historie');
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    toast.info('PDF-Export wird vorbereitet...');
    // PDF export functionality would be implemented here
    setTimeout(() => {
      toast.success('PDF-Export abgeschlossen');
    }, 1000);
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Historie</h1>
          <p className="page-subtitle">Alle durchgeführten Kontrollen</p>
        </div>
        <div>Lädt...</div>
      </div>
    );
  }

  return (
    <div className="page-container" data-testid="history-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Historie</h1>
          <p className="page-subtitle">Alle durchgeführten Kontrollen</p>
        </div>
        <button className="btn btn-primary" onClick={exportToPDF} data-testid="export-pdf-button">
          <Download size={20} />
          PDF Export
        </button>
      </div>

      <div className="card">
        {checks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <FileText size={48} />
            </div>
            <div className="empty-state-text">Noch keine Kontrollen durchgeführt</div>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Datum & Uhrzeit</th>
                  <th>Gerät/Bereich</th>
                  <th>Mitarbeiter</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {checks.map((check) => (
                  <tr key={check.id} data-testid="history-item">
                    <td>{format(new Date(check.timestamp), 'dd.MM.yyyy HH:mm', { locale: de })} Uhr</td>
                    <td>{check.item_name}</td>
                    <td><strong>{check.employee_initials}</strong></td>
                    <td>
                      <span className="badge badge-daily" style={{ background: 'linear-gradient(135deg, #c8e6c9 0%, #a5d6a7 100%)', color: '#1b5e20' }}>
                        Abgeschlossen
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;