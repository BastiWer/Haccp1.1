import { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, ClipboardCheck, Calendar, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Übersicht Ihrer HACCP-Kontrollen</p>
        </div>
        <div>Lädt...</div>
      </div>
    );
  }

  return (
    <div className="page-container" data-testid="dashboard-page">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Übersicht Ihrer HACCP-Kontrollen</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card" data-testid="stat-total-items">
          <div className="stat-header">
            <div className="stat-icon">
              <TrendingUp size={24} />
            </div>
          </div>
          <div className="stat-value">{stats?.total_items || 0}</div>
          <div className="stat-label">Geräte/Bereiche</div>
        </div>

        <div className="stat-card" data-testid="stat-checks-today">
          <div className="stat-header">
            <div className="stat-icon">
              <CheckCircle2 size={24} />
            </div>
          </div>
          <div className="stat-value">{stats?.checks_today || 0}</div>
          <div className="stat-label">Kontrollen Heute</div>
        </div>

        <div className="stat-card" data-testid="stat-checks-week">
          <div className="stat-header">
            <div className="stat-icon">
              <Calendar size={24} />
            </div>
          </div>
          <div className="stat-value">{stats?.checks_this_week || 0}</div>
          <div className="stat-label">Kontrollen Diese Woche</div>
        </div>

        <div className="stat-card" data-testid="stat-checks-month">
          <div className="stat-header">
            <div className="stat-icon">
              <ClipboardCheck size={24} />
            </div>
          </div>
          <div className="stat-value">{stats?.checks_this_month || 0}</div>
          <div className="stat-label">Kontrollen Dieser Monat</div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>
          Letzte Aktivitäten
        </h2>
        
        {stats?.recent_checks && stats.recent_checks.length > 0 ? (
          <div className="activity-list">
            {stats.recent_checks.map((check) => (
              <div key={check.id} className="activity-item" data-testid="activity-item">
                <div className="activity-icon">
                  <CheckCircle2 size={20} />
                </div>
                <div className="activity-details">
                  <div className="activity-title">{check.item_name}</div>
                  <div className="activity-meta">
                    {check.employee_initials} • {format(new Date(check.timestamp), 'dd.MM.yyyy HH:mm', { locale: de })} Uhr
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <ClipboardCheck size={48} />
            </div>
            <div className="empty-state-text">Noch keine Kontrollen durchgeführt</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;