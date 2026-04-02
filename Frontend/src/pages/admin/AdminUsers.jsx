import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageTitle from '../../components/PageTitle';
import apiClient from '../../utils/apiClient';
import '../../AdminStyles/UsersList.css';

const AdminUsers = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await apiClient.get('/users');
        setUsers(data?.users || []);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Unable to fetch users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleDelete = async (userId) => {
    if (!window.confirm('Delete this user?')) return;

    try {
      await apiClient.delete(`/users/delete/${userId}`);
      toast.success('User deleted');
      setUsers((prev) => prev.filter((user) => user._id !== userId));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to delete user');
    }
  };

  return (
    <>
      <PageTitle title="Admin Users" />
      <div className="usersList-container page-shell">
        <h2 className="usersList-title">Users</h2>
        {loading ? (
          <p className="loading-message">Loading users...</p>
        ) : (
          <div className="usersList-table-container">
            <table className="usersList-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>
                      <Link to={`/admin/users/${user._id}/role`} className="edit-icon">
                        Update Role
                      </Link>
                      <button className="delete-icon" onClick={() => handleDelete(user._id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminUsers;
