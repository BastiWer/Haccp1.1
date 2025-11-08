import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ManageItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', interval: 'daily' });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Bitte geben Sie einen Namen ein');
      return;
    }

    try {
      if (editingItem) {
        await axios.put(`${API}/items/${editingItem.id}`, formData);
        toast.success('Gerät/Bereich aktualisiert');
      } else {
        await axios.post(`${API}/items`, formData);
        toast.success('Gerät/Bereich hinzugefügt');
      }
      
      setShowModal(false);
      setEditingItem(null);
      setFormData({ name: '', interval: 'daily' });
      fetchItems();
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error('Fehler beim Speichern');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({ name: item.name, interval: item.interval });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Möchten Sie dieses Gerät/Bereich wirklich löschen?')) {
      return;
    }

    try {
      await axios.delete(`${API}/items/${id}`);
      toast.success('Gerät/Bereich gelöscht');
      fetchItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Fehler beim Löschen');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({ name: '', interval: 'daily' });
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Geräte verwalten</h1>
          <p className="page-subtitle">Geräte und Bereiche hinzufügen oder bearbeiten</p>
        </div>
        <div>Lädt...</div>
      </div>
    );
  }

  return (
    <div className="page-container" data-testid="manage-items-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Geräte verwalten</h1>
          <p className="page-subtitle">Geräte und Bereiche hinzufügen oder bearbeiten</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)} data-testid="add-item-button">
          <Plus size={20} />
          Hinzufügen
        </button>
      </div>

      <div className="card">
        {items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Plus size={48} />
            </div>
            <div className="empty-state-text">Noch keine Geräte/Bereiche vorhanden</div>
            <p style={{ color: '#9e9e9e', marginTop: '0.5rem' }}>Klicken Sie auf "Hinzufügen" um zu beginnen</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Reinigungsintervall</th>
                  <th>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} data-testid="item-row">
                    <td>{item.name}</td>
                    <td>
                      <span className={`badge badge-${item.interval}`}>
                        {item.interval === 'daily' && 'Täglich'}
                        {item.interval === 'weekly' && 'Wöchentlich'}
                        {item.interval === 'monthly' && 'Monatlich'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="icon-btn"
                          onClick={() => handleEdit(item)}
                          data-testid={`edit-button-${item.id}`}
                        >
                          <Edit2 size={18} color="#2e7d32" />
                        </button>
                        <button
                          className="icon-btn icon-btn-danger"
                          onClick={() => handleDelete(item.id)}
                          data-testid={`delete-button-${item.id}`}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()} data-testid="item-modal">
            <div className="modal-header">
              <h2 className="modal-title">
                {editingItem ? 'Gerät/Bereich bearbeiten' : 'Gerät/Bereich hinzufügen'}
              </h2>
              <button className="icon-btn" onClick={handleCloseModal} data-testid="close-modal-button">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="z.B. Kühlschrank, Arbeitsfläche, Bar"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  data-testid="item-name-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Reinigungsintervall</label>
                <select
                  className="form-select"
                  value={formData.interval}
                  onChange={(e) => setFormData({ ...formData, interval: e.target.value })}
                  data-testid="item-interval-select"
                >
                  <option value="daily">Täglich</option>
                  <option value="weekly">Wöchentlich</option>
                  <option value="monthly">Monatlich</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal} data-testid="cancel-button">
                  Abbrechen
                </button>
                <button type="submit" className="btn btn-primary" data-testid="submit-button">
                  {editingItem ? 'Aktualisieren' : 'Hinzufügen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageItems;