import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import PageTitle from '../components/PageTitle';
import apiClient from '../utils/apiClient';
import '../UserStyles/Form.css';

const DeleteUser = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onDelete = async () => {
    if (!window.confirm('Delete this user account?')) return;
    setLoading(true);
    try {
      await apiClient.delete(`/users/delete/${userId}`);
      toast.success('User deleted');
      navigate('/admin/users');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to delete user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageTitle title="Delete User" />
      <Navbar />
      <div className="form-container container">
        <div className="form-content">
          <div className="form">
            <h2>Delete User</h2>
            <p>Are you sure you want to permanently delete this account?</p>
            <button className="authBtn" onClick={onDelete} disabled={loading}>
              {loading ? 'Deleting...' : 'Delete User'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DeleteUser;
