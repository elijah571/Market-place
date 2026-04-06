import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageTitle from '../../components/PageTitle';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminStatusBadge } from '../../components/admin/AdminStatusBadge';
import apiClient from '../../utils/apiClient';
import '../../AdminStyles/UsersList.css';
import { formatCompactNumber, formatDateTime, sentenceCase } from '../../utils/formatters';

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
  const currentPage = meta.page || filters.page;
  const summary = useMemo(
    () => ({
      admins: users.filter((user) => user.role === 'admin').length,
      verified: users.filter((user) => user.isVerified).length,
    }),
    [users]
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
      <div className="admin-page">
        <AdminPageHeader
          eyebrow="User management"
          title="Users"
          description="Review customer accounts, separate admins from shoppers, and handle role changes from a more readable people dashboard."
          meta={
            <>
              <AdminStatusBadge tone="info">
                {meta.total ? formatCompactNumber(meta.total) : formatCompactNumber(users.length)} total
              </AdminStatusBadge>
              <AdminStatusBadge tone="success">{summary.verified} verified</AdminStatusBadge>
              <AdminStatusBadge tone="warning">{summary.admins} admins</AdminStatusBadge>
            </>
          }
        />

        <section className="admin-stat-grid">
          <article className="admin-stat-card">
            <p className="admin-stat-card__label">Visible users</p>
            <p className="admin-stat-card__value">{formatCompactNumber(users.length)}</p>
            <p className="admin-stat-card__meta">Current result set for the selected filters.</p>
          </article>
          <article className="admin-stat-card">
            <p className="admin-stat-card__label">Admins on page</p>
            <p className="admin-stat-card__value">{summary.admins}</p>
            <p className="admin-stat-card__meta">Accounts with elevated access in the loaded view.</p>
          </article>
          <article className="admin-stat-card">
            <p className="admin-stat-card__label">Verified users</p>
            <p className="admin-stat-card__value">{summary.verified}</p>
            <p className="admin-stat-card__meta">People who have completed email verification.</p>
          </article>
        </section>

        <section className="admin-table-shell">
          <div className="admin-table-shell__header">
            <div>
              <p className="admin-panel__eyebrow">People filters</p>
              <h2 className="admin-table-shell__title">Account directory</h2>
            </div>
          </div>

          <div className="admin-filter-bar usersList-filters">
            <input
              className="admin-input"
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
              className="admin-select"
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
            <div className="admin-loading-state">
              <p>Loading users...</p>
            </div>
          ) : (
            <div className="admin-table-shell__inner">
              <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Verified</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <p className="admin-table__primary">{user.name}</p>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <AdminStatusBadge tone={user.role === 'admin' ? 'warning' : 'info'}>
                        {sentenceCase(user.role)}
                      </AdminStatusBadge>
                    </td>
                    <td>
                      <AdminStatusBadge tone={user.isVerified ? 'success' : 'danger'}>
                        {user.isVerified ? 'Verified' : 'Pending'}
                      </AdminStatusBadge>
                    </td>
                    <td>{formatDateTime(user.createdAt)}</td>
                    <td>
                      <div className="admin-table__actions">
                        <Link
                          to={`/admin/users/${user._id}/role`}
                          className="admin-btn admin-btn--primary"
                        >
                          Update role
                        </Link>
                        <button
                          className="admin-btn admin-btn--danger"
                          onClick={() => handleDelete(user._id)}
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          )}

          {!loading && meta.totalPage > 1 ? (
            <div className="admin-pagination">
              <span className="admin-muted">
                Page {currentPage} of {meta.totalPage}
                {meta.total ? ` (${meta.total} users)` : ''}
              </span>
              <div className="admin-table__actions">
              <button
                  className="admin-btn admin-btn--ghost"
                type="button"
                  disabled={currentPage <= 1}
                onClick={() =>
                  setFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))
                }
              >
                Previous
              </button>
              <button
                  className="admin-btn admin-btn--primary"
                type="button"
                  disabled={currentPage >= (meta.totalPage || 1)}
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
        </section>
      </div>
    </>
  );
};

export default AdminUsers;
