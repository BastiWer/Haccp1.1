import { useEffect, useState } from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { ClipboardList, LayoutDashboard, Settings as SettingsIcon, History as HistoryIcon, LogOut, Moon, Sun } from 'lucide-react';
import { isAuthenticated, logout, getRestaurant } from './utils/auth';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Checklist from './pages/Checklist';
import ManageItems from './pages/ManageItems';
import History from './pages/History';
import Settings from './pages/Settings';
import './utils/auth'; // Initialize axios interceptors

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const restaurant = getRestaurant();
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);
  
  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/checklist', icon: ClipboardList, label: 'Checkliste' },
    { path: '/items', icon: SettingsIcon, label: 'Geräte' },
    { path: '/history', icon: HistoryIcon, label: 'Historie' },
    { path: '/settings', icon: SettingsIcon, label: 'Einstellungen' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <nav className="navigation">
      <div className="nav-brand">
        <ClipboardList size={28} />
        <div>
          <span style={{ display: 'block' }}>HACCP Kontrolle</span>
          {restaurant && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
              {restaurant.name}
            </span>
          )}
        </div>
      </div>
      <div className="nav-links">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${isActive ? 'active' : ''}`}
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
      <div className="nav-footer">
        <button
          onClick={toggleDarkMode}
          className="nav-link"
          data-testid="dark-mode-toggle"
          title={darkMode ? 'Hell-Modus' : 'Dunkel-Modus'}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          <span>{darkMode ? 'Hell-Modus' : 'Dunkel-Modus'}</span>
        </button>
        <button
          onClick={handleLogout}
          className="nav-link nav-logout"
          data-testid="logout-button"
        >
          <LogOut size={20} />
          <span>Abmelden</span>
        </button>
      </div>
    </nav>
  );
};

const AppLayout = ({ children }) => {
  return (
    <div className="app-layout">
      <Navigation />
      <main className="main-content">{children}</main>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/checklist"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Checklist />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/items"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ManageItems />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <History />
                </AppLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;