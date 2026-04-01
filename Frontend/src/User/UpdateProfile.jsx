import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import Navbar from '../components/Navbar';
import PageTitle from '../components/PageTitle';
import Loader from '../components/Loader';
import apiClient from '../utils/apiClient';
import { loadCurrentUser } from '../features/users/userSlice';
import '../UserStyles/Form.css';

const UpdateProfile = () => {
  const { user } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '' });

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || '', email: user.email || '' });
    }
  }, [user]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await apiClient.put('/users/me', form);
      await dispatch(loadCurrentUser());
      toast.success('Profile updated successfully');
      navigate('/profile');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return <Loader />;
  }

  return (
    <>
      <PageTitle title="Update Profile" />
      <Navbar />
      <div className="form-container container">
        <div className="form-content">
          <form className="form" onSubmit={onSubmit}>
            <h2>Update Profile</h2>
            <div className="input-group">
              <input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Name"
                required
              />
            </div>
            <div className="input-group">
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="Email"
                required
              />
            </div>
            <button className="authBtn" disabled={saving}>
              {saving ? 'Updating...' : 'Update'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default UpdateProfile;
