import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Navbar from '../../components/Navbar';
import PageTitle from '../../components/PageTitle';
import apiClient from '../../utils/apiClient';
import '../../AdminStyles/UpdateRole.css';

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
      <Navbar />
      <div className="page-wrapper">
        <div className="update-user-role-container">
          <h2>Update User Role</h2>
          {loading ? (
            <p>Loading user...</p>
          ) : (
            <form className="update-user-role-form" onSubmit={onSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input value={form.name} readOnly />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input value={form.email} readOnly />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button className="btn" type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Update Role'}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminUpdateRole;
