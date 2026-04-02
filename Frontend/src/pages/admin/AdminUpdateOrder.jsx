import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageTitle from '../../components/PageTitle';
import apiClient from '../../utils/apiClient';
import '../../AdminStyles/UpdateOrder.css';

const AdminUpdateOrder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState('Processing');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data } = await apiClient.get(`/admin/order/${id}`);
        setOrder(data?.data || null);
        setStatus(data?.data?.orderStatus || 'Processing');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Unable to load order');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const onUpdate = async () => {
    setSaving(true);
    try {
      await apiClient.put(`/admin/order/${id}`, { status });
      toast.success('Order updated successfully');
      navigate('/admin/orders');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update order');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-shell page-shell--narrow">
        <p style={{ textAlign: 'center' }}>Loading order...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="page-shell page-shell--narrow">
        <p style={{ textAlign: 'center' }}>Order not found</p>
      </div>
    );
  }

  return (
    <>
      <PageTitle title="Update Order" />
      <div className="order-container page-shell">
        <h1 className="order-title">Update Order</h1>
        <div className="order-details">
          <h2>Order</h2>
          <p>Order ID: #{order._id.slice(-8)}</p>
          <p>Payment: {order.paymentInfo?.status || 'Pending'}</p>
          <p>Total: ${order.totalPrice}</p>
        </div>
        <div className="order-items">
          <h2>Items</h2>
          <table className="order-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Qty</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {order.orderItems.map((item) => (
                <tr key={`${item.product}-${item.variantId || ''}`}>
                  <td>
                    <img src={item.image} alt={item.name} className="order-item-image" />
                  </td>
                  <td>{item.name}</td>
                  <td>{item.quantity}</td>
                  <td>${item.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="order-status">
          <h2>Status</h2>
          <select className="status-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="Processing">Processing</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
          </select>
          <button className="update-button" disabled={saving} onClick={onUpdate}>
            {saving ? 'Updating...' : 'Update Status'}
          </button>
        </div>
      </div>
    </>
  );
};

export default AdminUpdateOrder;
