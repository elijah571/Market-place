import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageTitle from '../../components/PageTitle';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminStatusBadge } from '../../components/admin/AdminStatusBadge';
import apiClient from '../../utils/apiClient';
import '../../AdminStyles/UpdateRole.css';
import { sentenceCase } from '../../utils/formatters';

const AdminUpdateRole = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', role: 'user' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await apiClient.get(`/users/${id}`);
        const user = data?.user;
        if (user) {
          setForm({
            name: user.name,
            email: user.email,
            role: user.role,
          });
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Unable to load user');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await apiClient.put(`/users/update/profile/${id}`, form);
      toast.success('User role updated');
      navigate('/admin/users');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update role');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageTitle title="Update User Role" />
      <div className="admin-page">
        <AdminPageHeader
          eyebrow="Access control"
          title="Update User Role"
          description="Promote or demote access without digging through a cramped form."
          meta={
            <AdminStatusBadge tone={form.role === 'admin' ? 'warning' : 'info'}>
              {sentenceCase(form.role || 'user')}
            </AdminStatusBadge>
          }
          actions={
            <div className="admin-header-actions">
              <Link className="admin-btn admin-btn--ghost" to="/admin/users">
                Back to users
              </Link>
            </div>
          }
        />

        <div className="update-user-role-shell">
          {loading ? (
            <div className="admin-loading-state surface-card">
              <p>Loading user...</p>
            </div>
          ) : (
            <form className="admin-form-shell update-user-role-form" onSubmit={onSubmit}>
              <div className="admin-form-shell__header">
                <div>
                  <p className="admin-panel__eyebrow">Role editor</p>
                  <h2 className="admin-form-shell__title">Account permissions</h2>
                </div>
              </div>

              <div className="admin-form-grid">
                <div className="admin-field">
                  <label htmlFor="role-user-name">Name</label>
                  <input id="role-user-name" className="admin-input" value={form.name} readOnly />
                </div>
                <div className="admin-field">
                  <label htmlFor="role-user-email">Email</label>
                  <input id="role-user-email" className="admin-input" value={form.email} readOnly />
                </div>
                <div className="admin-field">
                  <label htmlFor="role-user-select">Role</label>
                  <select
                    id="role-user-select"
                    className="admin-select"
                    value={form.role}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, role: event.target.value }))
                    }
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="admin-form-actions">
                <button className="admin-btn admin-btn--primary" type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Update Role'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminUpdateRole;
