import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import '../../UserStyles/Profile.css';
import PageTitle from '../../components/PageTitle';
import { addAddress, removeAddress, updateAddress } from '../../features/users/userSlice';
import { toast } from 'react-toastify';

const emptyAddress = {
  label: '',
  country: '',
  state: '',
  city: '',
  address: '',
  pinCode: '',
  phoneNo: '',
};

const Profile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);
  const [editingId, setEditingId] = useState('');
  const [addressForm, setAddressForm] = useState(emptyAddress);

  const userInitials = useMemo(() => {
    return String(user?.name || 'MP')
      .split(' ')
      .map((item) => item[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [user?.name]);

  const handleSubmitAddress = async (event) => {
    event.preventDefault();

    try {
      if (editingId) {
        await dispatch(updateAddress({ id: editingId, payload: addressForm })).unwrap();
        toast.success('Address updated');
      } else {
        await dispatch(addAddress(addressForm)).unwrap();
        toast.success('Address saved');
      }

      setEditingId('');
      setAddressForm(emptyAddress);
    } catch (error) {
      toast.error(error || 'Unable to save address');
    }
  };

  return (
    <>
      <PageTitle title="My Profile" />
      <div className="profile-container page-shell">
        <div className="profile-hero">
          <div className="profile-avatar-shell">
            {user?.avatar?.url ? (
              <img src={user.avatar.url} alt="User Profile" />
            ) : (
              <span>{userInitials}</span>
            )}
          </div>
          <div className="profile-hero-copy">
            <p className="profile-kicker">Account</p>
            <h1 className="profile-heading">Manage your account and delivery setup</h1>
            <p>
              Keep your profile updated, manage saved addresses, and jump into order tracking or
              security settings from one place.
            </p>
          </div>
        </div>

        <div className="profile-grid">
          <section className="profile-details">
            <div className="profile-detail">
              <h2>Name</h2>
              <p>{user?.name || '-'}</p>
            </div>
            <div className="profile-detail">
              <h2>Email</h2>
              <p>{user?.email || '-'}</p>
            </div>
            <div className="profile-detail">
              <h2>Role</h2>
              <p>{user?.role || 'user'}</p>
            </div>
            <div className="profile-buttons">
              <Link to="/profile/update">Update Profile</Link>
              <Link to="/orders/me">My Orders</Link>
              <Link to="/change-password">Change Password</Link>
            </div>
          </section>

          <section className="profile-address-section">
            <div className="profile-address-head">
              <h2>Saved Addresses</h2>
              <p>Reuse delivery details during checkout for faster ordering.</p>
            </div>
            <div className="profile-address-grid">
              {(user?.addresses || []).map((item) => (
                <article key={item._id} className="profile-address-card">
                  <strong>{item.label || `${item.city}, ${item.state}`}</strong>
                  <span>{item.address}</span>
                  <small>
                    {item.city}, {item.state}, {item.country}
                  </small>
                  <div className="profile-address-actions">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(item._id);
                        setAddressForm({
                          label: item.label || '',
                          country: item.country || '',
                          state: item.state || '',
                          city: item.city || '',
                          address: item.address || '',
                          pinCode: String(item.pinCode || ''),
                          phoneNo: String(item.phoneNo || ''),
                        });
                      }}
                    >
                      Edit
                    </button>
                    <button type="button" onClick={() => dispatch(removeAddress(item._id))}>
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <form className="profile-address-form" onSubmit={handleSubmitAddress}>
              <h3>{editingId ? 'Update address' : 'Add a new address'}</h3>
              <div className="profile-address-form-grid">
                <input
                  placeholder="Label"
                  value={addressForm.label}
                  onChange={(event) =>
                    setAddressForm((prev) => ({ ...prev, label: event.target.value }))
                  }
                />
                <input
                  placeholder="Country"
                  value={addressForm.country}
                  onChange={(event) =>
                    setAddressForm((prev) => ({ ...prev, country: event.target.value }))
                  }
                />
                <input
                  placeholder="State"
                  value={addressForm.state}
                  onChange={(event) =>
                    setAddressForm((prev) => ({ ...prev, state: event.target.value }))
                  }
                />
                <input
                  placeholder="City"
                  value={addressForm.city}
                  onChange={(event) =>
                    setAddressForm((prev) => ({ ...prev, city: event.target.value }))
                  }
                />
                <input
                  placeholder="Pin code"
                  value={addressForm.pinCode}
                  onChange={(event) =>
                    setAddressForm((prev) => ({ ...prev, pinCode: event.target.value }))
                  }
                />
                <input
                  placeholder="Phone number"
                  value={addressForm.phoneNo}
                  onChange={(event) =>
                    setAddressForm((prev) => ({ ...prev, phoneNo: event.target.value }))
                  }
                />
              </div>
              <textarea
                placeholder="Street address"
                value={addressForm.address}
                onChange={(event) =>
                  setAddressForm((prev) => ({ ...prev, address: event.target.value }))
                }
              />
              <div className="profile-address-actions">
                <button type="submit">{editingId ? 'Update address' : 'Save address'}</button>
                {editingId ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId('');
                      setAddressForm(emptyAddress);
                    }}
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </form>
          </section>
        </div>
      </div>
    </>
  );
};

export default Profile;
