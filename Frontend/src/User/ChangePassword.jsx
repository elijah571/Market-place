import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import PageTitle from '../components/PageTitle';
import apiClient from '../utils/apiClient';
import '../UserStyles/Form.css';

const ChangePassword = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const onSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await apiClient.put('/users/change-password', form);
      toast.success('Password updated');
      navigate('/profile');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to change password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageTitle title="Change Password" />
      <Navbar />
      <div className="form-container container">
        <div className="form-content">
          <form className="form" onSubmit={onSubmit}>
            <h2>Change Password</h2>
            <div className="input-group">
              <input
                type="password"
                placeholder="Current Password"
                value={form.currentPassword}
                onChange={(e) => setForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                required
              />
            </div>
            <div className="input-group">
              <input
                type="password"
                placeholder="New Password"
                value={form.newPassword}
                onChange={(e) => setForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                required
              />
            </div>
            <div className="input-group">
              <input
                type="password"
                placeholder="Confirm Password"
                value={form.confirmPassword}
                onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                required
              />
            </div>
            <button className="authBtn" disabled={saving}>
              {saving ? 'Updating...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default ChangePassword;
