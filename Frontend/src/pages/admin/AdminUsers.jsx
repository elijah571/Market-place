import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageTitle from '../../components/PageTitle';
import apiClient from '../../utils/apiClient';
import '../../AdminStyles/UsersList.css';

const AdminUsers = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPage: 1, total: 0 });
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    page: 1,
    limit: 20,
  });
  const deferredSearch = useDeferredValue(filters.search);
  const queryFilters = useMemo(
    () => ({
      ...filters,
      search: deferredSearch,
    }),
    [deferredSearch, filters]
  );

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();

        Object.entries(queryFilters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.set(key, String(value));
          }
        });

        const { data } = await apiClient.get(`/users?${params.toString()}`);
        setUsers(data?.users || []);
        setMeta(data?.meta || { page: 1, totalPage: 1, total: 0 });
      } catch (error) {
        toast.error(error.response?.data?.message || 'Unable to fetch users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [queryFilters]);

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
        <div
          style={{
            display: 'grid',
            gap: '0.75rem',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            marginBottom: '1.5rem',
          }}
        >
          <input
            placeholder="Search name or email"
            value={filters.search}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                search: event.target.value,
                page: 1,
              }))
            }
          />
          <select
            value={filters.role}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                role: event.target.value,
                page: 1,
              }))
            }
          >
            <option value="">All roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </div>
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
        {!loading && meta.totalPage > 1 ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '1.5rem',
              gap: '1rem',
            }}
          >
            <span>
              Page {meta.page || filters.page} of {meta.totalPage}
              {meta.total ? ` (${meta.total} users)` : ''}
            </span>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                disabled={(meta.page || filters.page) <= 1}
                onClick={() =>
                  setFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))
                }
              >
                Previous
              </button>
              <button
                type="button"
                disabled={(meta.page || filters.page) >= (meta.totalPage || 1)}
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    page: Math.min(meta.totalPage || prev.page, prev.page + 1),
                  }))
                }
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
};

export default AdminUsers;
