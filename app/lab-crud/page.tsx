'use client';

import { useEffect, useState, useCallback } from 'react';

/**
 * Lab CRUD — Academic Module UI
 *
 * This page is completely isolated from the existing Supabase-based dashboard.
 * Data flow: UI → /api/lab-services → ServiceService → ServiceRepository → CSV
 *
 * It does NOT import anything from src/lib/store.ts or @supabase/*.
 */

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
}

const emptyForm: Omit<Service, 'id'> = {
  name: '',
  description: '',
  price: 0,
  durationMinutes: 30,
};

export default function LabCrudPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // ── Fetch services ──
  const fetchServices = useCallback(async () => {
    try {
      const query = filter ? `?filter=${encodeURIComponent(filter)}` : '';
      const res = await fetch(`/api/lab-services${query}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setServices(data);
    } catch {
      setError('Failed to load services');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // ── Add or Update ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (editingId) {
        // UPDATE
        const res = await fetch(`/api/lab-services/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Update failed');
        }
      } else {
        // ADD
        const res = await fetch('/api/lab-services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Add failed');
        }
      }

      setForm(emptyForm);
      setEditingId(null);
      await fetchServices();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  // ── Delete ──
  const handleDelete = async (id: string) => {
    setError('');
    try {
      const res = await fetch(`/api/lab-services/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      await fetchServices();
    } catch {
      setError('Failed to delete service');
    }
  };

  // ── Start editing ──
  const startEdit = (s: Service) => {
    setEditingId(s.id);
    setForm({
      name: s.name,
      description: s.description,
      price: s.price,
      durationMinutes: s.durationMinutes,
    });
  };

  // ── Cancel editing ──
  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
        📋 Lab CRUD — Academic Module
      </h1>
      <p style={{ color: '#666', marginBottom: '2rem', fontSize: '0.9rem' }}>
        UI → ServiceService → ServiceRepository → CSV file &nbsp;|&nbsp; Isolated from Supabase
      </p>

      {/* ── Error display ── */}
      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c',
          padding: '0.75rem 1rem', borderRadius: 8, marginBottom: '1rem', fontSize: '0.9rem'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* ── Filter ── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <input
          type="text"
          placeholder="🔍 Filter by name..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            width: '100%', padding: '0.6rem 0.75rem', borderRadius: 8,
            border: '1px solid #d1d5db', fontSize: '0.9rem'
          }}
        />
      </div>

      {/* ── Services table ── */}
      <div style={{
        border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', marginBottom: '2rem'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Description</th>
              <th style={thStyle}>Price (€)</th>
              <th style={thStyle}>Duration</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                  Loading...
                </td>
              </tr>
            ) : services.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                  No services found.
                </td>
              </tr>
            ) : (
              services.map((s) => (
                <tr key={s.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={tdStyle}>{s.id}</td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{s.name}</td>
                  <td style={tdStyle}>{s.description}</td>
                  <td style={tdStyle}>€{s.price}</td>
                  <td style={tdStyle}>{s.durationMinutes} min</td>
                  <td style={tdStyle}>
                    <button onClick={() => startEdit(s)} style={editBtnStyle}>✏️ Edit</button>
                    <button onClick={() => handleDelete(s.id)} style={deleteBtnStyle}>🗑️ Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Add / Edit form ── */}
      <div style={{
        border: '1px solid #e5e7eb', borderRadius: 8, padding: '1.5rem',
        background: '#f9fafb'
      }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>
          {editingId ? '✏️ Edit Service' : '➕ Add New Service'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={labelStyle}>Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Description</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Price (€) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Duration (min)</label>
              <input
                type="number"
                min="1"
                value={form.durationMinutes}
                onChange={(e) => setForm((f) => ({ ...f, durationMinutes: Number(e.target.value) }))}
                style={inputStyle}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" style={submitBtnStyle}>
              {editingId ? 'Update Service' : 'Add Service'}
            </button>
            {editingId && (
              <button type="button" onClick={cancelEdit} style={cancelBtnStyle}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ── Architecture note ── */}
      <div style={{
        marginTop: '2rem', padding: '1rem', background: '#eff6ff',
        border: '1px solid #bfdbfe', borderRadius: 8, fontSize: '0.85rem', color: '#1e40af'
      }}>
        <strong>Architecture:</strong> This page calls <code>/api/lab-services</code> API routes,
        which instantiate <code>ServiceService</code> (with <code>ServiceRepository</code> injected via constructor).
        The repository reads/writes <code>lab-crud/data/services.csv</code> using Node.js <code>fs</code>.
        No Supabase involved.
      </div>
    </div>
  );
}

// ── Inline styles ──

const thStyle: React.CSSProperties = {
  textAlign: 'left', padding: '0.6rem 0.75rem', fontWeight: 600, fontSize: '0.8rem',
  textTransform: 'uppercase', color: '#6b7280', letterSpacing: '0.05em',
};

const tdStyle: React.CSSProperties = {
  padding: '0.6rem 0.75rem',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontWeight: 500, marginBottom: '0.25rem', fontSize: '0.85rem',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.5rem 0.65rem', borderRadius: 6,
  border: '1px solid #d1d5db', fontSize: '0.9rem',
};

const editBtnStyle: React.CSSProperties = {
  background: 'none', border: '1px solid #d1d5db', borderRadius: 6,
  padding: '0.25rem 0.5rem', cursor: 'pointer', marginRight: '0.25rem', fontSize: '0.8rem',
};

const deleteBtnStyle: React.CSSProperties = {
  background: 'none', border: '1px solid #fca5a5', borderRadius: 6,
  padding: '0.25rem 0.5rem', cursor: 'pointer', color: '#b91c1c', fontSize: '0.8rem',
};

const submitBtnStyle: React.CSSProperties = {
  background: '#2563eb', color: 'white', border: 'none', borderRadius: 8,
  padding: '0.6rem 1.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
};

const cancelBtnStyle: React.CSSProperties = {
  background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: 8,
  padding: '0.6rem 1.5rem', cursor: 'pointer', fontSize: '0.9rem',
};
