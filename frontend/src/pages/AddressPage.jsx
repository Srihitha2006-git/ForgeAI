import React, { useState, useEffect } from 'react';
import { addressService } from '../services/addressService';

export default function AddressPage({ onBack, onShowToast }) {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirmation state
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Form fields state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('India');
  const [addressType, setAddressType] = useState('HOME');
  const [isDefault, setIsDefault] = useState(false);

  const fetchAddresses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await addressService.getAddresses();
      setAddresses(data);
    } catch (err) {
      console.error('Error fetching addresses:', err);
      setError('Unable to load your addresses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const openAddModal = () => {
    setEditingAddress(null);
    setFullName('');
    setPhone('');
    setAddressLine1('');
    setAddressLine2('');
    setCity('');
    setState('');
    setPostalCode('');
    setCountry('India');
    setAddressType('HOME');
    setIsDefault(addresses.length === 0); // Automatically make default if it is the first address
    setModalError('');
    setIsModalOpen(true);
  };

  const openEditModal = (address) => {
    setEditingAddress(address);
    setFullName(address.fullName);
    setPhone(address.phone);
    setAddressLine1(address.addressLine1);
    setAddressLine2(address.addressLine2 || '');
    setCity(address.city);
    setState(address.state);
    setPostalCode(address.postalCode);
    setCountry(address.country);
    setAddressType(address.addressType);
    setIsDefault(address.isDefault);
    setModalError('');
    setIsOpenModalDirectly(address);
  };

  const setIsOpenModalDirectly = (address) => {
    setIsModalOpen(true);
  };

  const handleSetDefault = async (addressId) => {
    try {
      const updated = await addressService.setDefaultAddress(addressId);
      
      // Update local state by marking only the selected address as default
      setAddresses(prev => prev.map(addr => {
        if (addr.id === addressId) {
          return { ...addr, isDefault: true };
        }
        return { ...addr, isDefault: false };
      }));

      if (onShowToast) {
        onShowToast('Default address updated');
      }
    } catch (err) {
      console.error('Error setting default address:', err);
      alert('Failed to update default address. Please try again.');
    }
  };

  const handleDeleteAddress = async () => {
    if (!confirmDeleteId) return;

    try {
      const targetAddress = addresses.find(a => a.id === confirmDeleteId);
      const wasDefault = targetAddress?.isDefault;

      await addressService.deleteAddress(confirmDeleteId);
      
      // Refresh addresses list from the backend to guarantee accuracy, or update state optimistically
      const data = await addressService.getAddresses();
      setAddresses(data);

      setConfirmDeleteId(null);
      if (onShowToast) {
        onShowToast('Address deleted successfully');
      }
    } catch (err) {
      console.error('Error deleting address:', err);
      alert('Failed to delete address. Please try again.');
    }
  };

  const validateForm = () => {
    if (!fullName.trim()) return 'Full Name is required.';
    if (fullName.trim().length < 2) return 'Full Name must be at least 2 characters.';
    if (!phone.trim()) return 'Phone Number is required.';
    
    const phoneRegex = /^[+]?[0-9\s\-()]{10,15}$/;
    if (!phoneRegex.test(phone.trim())) {
      return 'Invalid phone number format. It must be 10-15 digits.';
    }

    if (!addressLine1.trim()) return 'Address Line 1 is required.';
    if (!city.trim()) return 'City is required.';
    if (!state.trim()) return 'State is required.';
    if (!postalCode.trim()) return 'Postal Code is required.';
    if (!country.trim()) return 'Country is required.';

    if (country.toLowerCase().trim() === 'india') {
      const inPostalRegex = /^\d{6}$/;
      if (!inPostalRegex.test(postalCode.trim())) {
        return 'Postal Code for India must be exactly 6 digits.';
      }
    } else {
      if (postalCode.trim().length < 3 || postalCode.trim().length > 10) {
        return 'Postal Code must be between 3 and 10 characters.';
      }
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    const formError = validateForm();
    if (formError) {
      setModalError(formError);
      return;
    }

    setSubmitting(true);

    const payload = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2.trim() || null,
      city: city.trim(),
      state: state.trim(),
      postalCode: postalCode.trim(),
      country: country.trim(),
      addressType,
      isDefault
    };

    try {
      if (editingAddress) {
        await addressService.updateAddress(editingAddress.id, payload);
        if (onShowToast) {
          onShowToast('Address updated successfully');
        }
      } else {
        await addressService.addAddress(payload);
        if (onShowToast) {
          onShowToast('Address added successfully');
        }
      }

      // Fetch fresh list from database to ensure MySQL synchronization
      const freshData = await addressService.getAddresses();
      setAddresses(freshData);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving address:', err);
      setModalError(err.response?.data?.error || 'Failed to save address. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper icons
  const getAddressIcon = (type) => {
    switch (type) {
      case 'HOME':
        return '🏠';
      case 'OFFICE':
        return '🏢';
      default:
        return '📍';
    }
  };

  // Styles
  const selectStyles = {
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid var(--card-border)',
    borderRadius: '12px',
    color: '#ffffff',
    padding: '0.6rem 0.85rem',
    fontFamily: 'inherit',
    fontSize: '0.95rem',
    outline: 'none',
    width: '100%',
    cursor: 'pointer'
  };

  const inputStyles = {
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid var(--card-border)',
    borderRadius: '12px',
    color: '#ffffff',
    padding: '0.6rem 0.85rem',
    fontFamily: 'inherit',
    fontSize: '0.95rem',
    outline: 'none',
    width: '100%'
  };

  const labelStyles = {
    color: 'var(--text-muted)',
    fontSize: '0.8rem',
    fontWeight: 500,
    marginBottom: '0.25rem',
    display: 'block'
  };

  // 1. LOADING SKELETON STATE
  if (loading) {
    return (
      <div className="container" style={{ width: '100%', animation: 'fadeIn 0.3s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ color: 'white', margin: 0, fontSize: '2rem', fontWeight: 800 }}>My Addresses</h1>
            <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
              Manage your saved delivery addresses.
            </p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {[1, 2].map((i) => (
            <div key={i} className="glass-panel" style={{ height: '220px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div className="skeleton-line" style={{ height: '1.25rem', width: '80px', borderRadius: '4px' }}></div>
                <div className="skeleton-line" style={{ height: '1.25rem', width: '60px', borderRadius: '4px' }}></div>
              </div>
              <div className="skeleton-line" style={{ height: '1.5rem', width: '140px', marginTop: '0.5rem' }}></div>
              <div className="skeleton-line" style={{ height: '1rem', width: '100px' }}></div>
              <div className="skeleton-line" style={{ height: '1rem', width: '220px' }}></div>
              <div className="skeleton-line" style={{ height: '1rem', width: '180px' }}></div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto' }}>
                <div className="skeleton-line" style={{ height: '1.25rem', width: '50px' }}></div>
                <div className="skeleton-line" style={{ height: '1.25rem', width: '50px' }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. ERROR STATE
  if (error) {
    return (
      <div className="container" style={{ width: '100%' }}>
        <div className="error-state" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1.25rem' }}>
            <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h2 style={{ color: 'white', marginBottom: '0.5rem' }}>Unable to load your addresses</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{error}</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <button className="details-back-link" onClick={onBack} style={{ marginBottom: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Go to Marketplace
            </button>
            <button className="search-btn" onClick={fetchAddresses} style={{ padding: '0.6rem 1.5rem', fontSize: '0.85rem' }}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ width: '100%', animation: 'fadeIn 0.3s ease' }}>
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <button className="details-back-link" onClick={onBack} style={{ margin: '0 0 0.5rem 0' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back to Marketplace
          </button>
          <h1 style={{ color: 'white', margin: 0, fontSize: '2.25rem', fontWeight: 800 }}>My Addresses</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
            Manage your saved delivery addresses.
          </p>
        </div>
        
        {addresses.length > 0 && (
          <button 
            className="search-btn" 
            onClick={openAddModal}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add New Address
          </button>
        )}
      </div>

      {/* 3. EMPTY STATE */}
      {addresses.length === 0 ? (
        <div className="empty-state" style={{ padding: '5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <h3 style={{ color: 'white', fontSize: '1.4rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>No saved addresses</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '350px', fontSize: '0.95rem', margin: '0 0 2rem 0' }}>
            Add an address to make checkout faster.
          </p>
          <button 
            className="search-btn" 
            onClick={openAddModal}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 2rem' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add New Address
          </button>
        </div>
      ) : (
        /* ADDRESS LIST GRID */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {addresses.map((address) => (
            <div 
              key={address.id} 
              className="glass-panel" 
              style={{ 
                padding: '1.5rem', 
                display: 'flex', 
                flexDirection: 'column', 
                border: address.isDefault ? '1px solid rgba(99, 102, 241, 0.45)' : '1px solid var(--card-border)',
                background: address.isDefault ? 'rgba(99, 102, 241, 0.03)' : 'rgba(17, 24, 39, 0.65)',
                boxShadow: address.isDefault ? '0 10px 30px rgba(99, 102, 241, 0.08)' : 'none',
                position: 'relative',
                borderRadius: '16px',
                transition: 'transform 0.2s, border-color 0.2s'
              }}
            >
              {/* Card Header Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <span 
                  style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 700, 
                    color: '#ffffff', 
                    background: 'rgba(255, 255, 255, 0.06)', 
                    padding: '0.25rem 0.6rem', 
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <span>{getAddressIcon(address.addressType)}</span>
                  <span>{address.addressType}</span>
                </span>

                {address.isDefault ? (
                  <span 
                    style={{ 
                      fontSize: '0.7rem', 
                      fontWeight: 800, 
                      letterSpacing: '0.05em',
                      color: '#a5b4fc', 
                      background: 'rgba(99, 102, 241, 0.15)', 
                      padding: '0.25rem 0.6rem', 
                      borderRadius: '6px',
                      border: '1px solid rgba(99, 102, 241, 0.3)'
                    }}
                  >
                    DEFAULT
                  </span>
                ) : (
                  <button 
                    onClick={() => handleSetDefault(address.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.color = '#a5b4fc'}
                    onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
                  >
                    Set as Default
                  </button>
                )}
              </div>

              {/* Address Details */}
              <div style={{ flexGrow: 1, marginBottom: '1.5rem' }}>
                <h4 style={{ color: '#ffffff', margin: '0 0 0.25rem 0', fontSize: '1.05rem', fontWeight: 700 }}>
                  {address.fullName}
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 0.75rem 0', fontWeight: 500 }}>
                  {address.phone}
                </p>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  <div>{address.addressLine1}</div>
                  {address.addressLine2 && <div>{address.addressLine2}</div>}
                  <div>{address.city}, {address.state} - {address.postalCode}</div>
                  <div>{address.country}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '1rem' }}>
                <button 
                  onClick={() => openEditModal(address)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                  onMouseEnter={(e) => e.target.style.color = '#ffffff'}
                  onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  Edit
                </button>

                <button 
                  onClick={() => setConfirmDeleteId(address.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    marginLeft: 'auto'
                  }}
                  onMouseEnter={(e) => e.target.style.opacity = '0.85'}
                  onMouseLeave={(e) => e.target.style.opacity = '1'}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ==================================================
          ADD / EDIT ADDRESS MODAL
         ================================================== */}
      {isModalOpen && (
        <div className="auth-overlay" onClick={() => setIsModalOpen(false)}>
          <div 
            className="auth-modal glass-panel" 
            onClick={(e) => e.stopPropagation()} 
            style={{ 
              width: '100%', 
              maxWidth: '500px', 
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '1.5rem 2rem', 
              position: 'relative',
              borderRadius: '20px',
              animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <button className="auth-close-btn" onClick={() => setIsModalOpen(false)} aria-label="Close form modal">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <h2 style={{ color: 'white', marginBottom: '0.25rem', fontWeight: 800, fontSize: '1.6rem' }}>
              {editingAddress ? 'Edit Address' : 'Add New Address'}
            </h2>
            <p className="subtitle" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
              {editingAddress ? 'Update your saved address details.' : 'Provide delivery location details.'}
            </p>

            {modalError && (
              <div className="error-alert" style={{ marginBottom: '1.25rem', display: 'flex', gap: '0.75rem' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              
              {/* Row 1: Full Name */}
              <div>
                <label style={labelStyles}>Full Name *</label>
                <input 
                  type="text" 
                  style={inputStyles}
                  placeholder="e.g. Srihitha Reddy"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              {/* Row 2: Phone Number */}
              <div>
                <label style={labelStyles}>Phone Number *</label>
                <input 
                  type="tel" 
                  style={inputStyles}
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              {/* Row 3: Address Line 1 */}
              <div>
                <label style={labelStyles}>Address Line 1 *</label>
                <input 
                  type="text" 
                  style={inputStyles}
                  placeholder="Street name, flat/building number"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  required
                />
              </div>

              {/* Row 4: Address Line 2 */}
              <div>
                <label style={labelStyles}>Address Line 2 (Optional)</label>
                <input 
                  type="text" 
                  style={inputStyles}
                  placeholder="Apartment, suite, landmark etc."
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                />
              </div>

              {/* Row 5: City & State (Grid) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyles}>City *</label>
                  <input 
                    type="text" 
                    style={inputStyles}
                    placeholder="e.g. Hyderabad"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={labelStyles}>State *</label>
                  <input 
                    type="text" 
                    style={inputStyles}
                    placeholder="e.g. Telangana"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Row 6: Postal Code & Country (Grid) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyles}>Postal Code *</label>
                  <input 
                    type="text" 
                    style={inputStyles}
                    placeholder="e.g. 500081"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={labelStyles}>Country *</label>
                  <input 
                    type="text" 
                    style={inputStyles}
                    placeholder="e.g. India"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Row 7: Address Type Selector */}
              <div>
                <label style={labelStyles}>Address Type *</label>
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.25rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.9rem', color: 'white' }}>
                    <input 
                      type="radio" 
                      name="addressType" 
                      checked={addressType === 'HOME'}
                      onChange={() => setAddressType('HOME')}
                      style={{ cursor: 'pointer', accentColor: 'var(--primary)' }}
                    />
                    Home 🏠
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.9rem', color: 'white' }}>
                    <input 
                      type="radio" 
                      name="addressType" 
                      checked={addressType === 'OFFICE'}
                      onChange={() => setAddressType('OFFICE')}
                      style={{ cursor: 'pointer', accentColor: 'var(--primary)' }}
                    />
                    Office 🏢
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.9rem', color: 'white' }}>
                    <input 
                      type="radio" 
                      name="addressType" 
                      checked={addressType === 'OTHER'}
                      onChange={() => setAddressType('OTHER')}
                      style={{ cursor: 'pointer', accentColor: 'var(--primary)' }}
                    />
                    Other 📍
                  </label>
                </div>
              </div>

              {/* Row 8: Set as Default Checkbox */}
              <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', color: 'white' }}>
                  <input 
                    type="checkbox" 
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    disabled={addresses.length === 0 || (editingAddress && editingAddress.isDefault)} // Cannot unset default if it is the only one or if editing default
                    style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                  />
                  Set as default address
                </label>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem' }}>
                <button 
                  type="button" 
                  className="details-back-link" 
                  onClick={() => setIsModalOpen(false)}
                  style={{ flex: 1, justifyContent: 'center', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '0.75rem', marginBottom: 0 }}
                >
                  Cancel
                </button>
                
                <button 
                  type="submit" 
                  className="search-btn" 
                  disabled={submitting}
                  style={{ flex: 1, padding: '0.75rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                >
                  {submitting ? (
                    <span className="spinner" style={{ borderLeftColor: 'transparent', width: '18px', height: '18px' }}></span>
                  ) : (
                    'Save Address'
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ==================================================
          DELETE CONFIRMATION MODAL
         ================================================== */}
      {confirmDeleteId && (
        <div className="auth-overlay" onClick={() => setConfirmDeleteId(null)}>
          <div 
            className="auth-modal glass-panel" 
            onClick={(e) => e.stopPropagation()} 
            style={{ 
              width: '100%', 
              maxWidth: '380px', 
              padding: '2rem', 
              position: 'relative',
              borderRadius: '16px',
              textAlign: 'center',
              animation: 'scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </div>
            
            <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>
              Delete this address?
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0 0 1.75rem 0', lineHeight: 1.4 }}>
              This action cannot be undone. This address will be permanently removed.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                type="button" 
                className="details-back-link" 
                onClick={() => setConfirmDeleteId(null)}
                style={{ flex: 1, justifyContent: 'center', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '0.7rem', marginBottom: 0 }}
              >
                Cancel
              </button>
              
              <button 
                type="button" 
                onClick={handleDeleteAddress}
                style={{ flex: 1, padding: '0.7rem', background: '#ef4444', border: 'none', color: '#ffffff', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', transition: 'filter 0.2s' }}
                onMouseEnter={(e) => e.target.style.filter = 'brightness(0.95)'}
                onMouseLeave={(e) => e.target.style.filter = 'none'}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
