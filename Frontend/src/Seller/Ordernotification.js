import React from 'react'
import { Bell, X, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';


const Ordernotification = ({ orders = [], onClose, hasNewOrder = false, onClearAll = null, onDeleteOrder = null }) => {
   // Handle clear all notifications
   const handleClearAll = async () => {
    if (orders.length === 0) {
      return;
    }

    // Show confirmation dialog
    const result = await Swal.fire({
      title: 'Clear All Notifications?',
      text: `You are about to clear ${orders.length} notification(s). This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Clear All',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        // Call parent component's clear function if provided
        if (onClearAll && typeof onClearAll === 'function') {
          onClearAll();
          
          // Show success message
          await Swal.fire({
            title: 'Cleared!',
            text: 'All notifications have been cleared.',
            icon: 'success',
            confirmButtonColor: '#10b981',
            timer: 2000,
            showConfirmButton: false
          });
        } else {
          console.warn('onClearAll callback not provided');
        }
      } catch (error) {
        console.error('Error clearing notifications:', error);
        Swal.fire({
          title: 'Error',
          text: 'Failed to clear notifications. Please try again.',
          icon: 'error',
          confirmButtonColor: '#ef4444'
        });
      }
    }
  };

  // Handle delete single order
  const handleDeleteOrder = async (orderId) => {
    const result = await Swal.fire({
      title: 'Delete Notification?',
      text: 'Are you sure you want to delete this notification?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        if (onDeleteOrder && typeof onDeleteOrder === 'function') {
          onDeleteOrder(orderId);
          
          Swal.fire({
            title: 'Deleted!',
            text: 'Notification has been deleted.',
            icon: 'success',
            confirmButtonColor: '#10b981',
            timer: 1500,
            showConfirmButton: false
          });
        } else {
          console.warn('onDeleteOrder callback not provided');
        }
      } catch (error) {
        console.error('Error deleting notification:', error);
        Swal.fire({
          title: 'Error',
          text: 'Failed to delete notification. Please try again.',
          icon: 'error',
          confirmButtonColor: '#ef4444'
        });
      }
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '400px',
      height: '100vh',
      background: 'white',
      boxShadow: '-4px 0 12px rgba(0,0,0,0.15)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      animation: 'slideIn 0.3s ease-out'
    }}>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>

      {/* Header */}
      <div style={{
        padding: '1.5rem',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: hasNewOrder ? '#ecfdf5' : 'white'
      }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <Bell size={20} />
          Orders ({orders.length})
        </h3>
        <button 
          onClick={onClose} 
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer', 
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          title="Close notifications"
        >
          <X size={24} color="#6b7280" />
        </button>
      </div>

      {/* Content Area */}
      <div style={{ padding: '1rem', overflowY: 'auto', flex: 1 }}>
        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
            <Bell size={40} style={{ opacity: 0.5, margin: '0 auto 1rem' }} />
            <p style={{ fontSize: '1rem', fontWeight: '500' }}>No orders yet</p>
            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>New orders will appear here</p>
          </div>
        ) : (
          orders.slice(0, 10).map((order, index) => (
            <div 
              key={order._id} 
              style={{
                background: '#f9fafb',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                border: '2px solid #e5e7eb',
                position: 'relative',
                transition: 'all 0.2s',
                animation: `fadeIn 0.3s ease-out ${index * 0.05}s both`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#10b981';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <style>{`
                @keyframes fadeIn {
                  from {
                    opacity: 0;
                    transform: translateY(10px);
                  }
                  to {
                    opacity: 1;
                    transform: translateY(0);
                  }
                }
              `}</style>

              {/* Delete button for individual order */}
              <button
                onClick={() => handleDeleteOrder(order._id)}
                style={{
                  position: 'absolute',
                  top: '0.5rem',
                  right: '0.5rem',
                  background: '#fee2e2',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '0.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#fecaca';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#fee2e2';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                title="Delete this notification"
              >
                <X size={16} color="#dc2626" />
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', paddingRight: '2rem' }}>
                <span style={{ fontWeight: '700', fontSize: '0.875rem' }}>Order #{order._id.substring(0, 6)}</span>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  background: order.status === 'Delivered' ? '#d1fae5' : order.status === 'Shipped' ? '#dbeafe' : '#fef3c7',
                  color: order.status === 'Delivered' ? '#065f46' : order.status === 'Shipped' ? '#0c4a6e' : '#92400e'
                }}>
                  {order.status}
                </span>
              </div>

              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                👤 {order.customerName}
              </p>

              <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#10b981', marginBottom: '0.5rem' }}>
                ₹{order.totalAmount?.toLocaleString() || '0'}
              </p>

              <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                📅 {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString()}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Footer Buttons */}
      <div style={{
        padding: '1rem',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        gap: '0.75rem',
        background: '#f9fafb'
      }}>
        {/* Clear All Button */}
        <button
          onClick={handleClearAll}
          disabled={orders.length === 0}
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            background: orders.length === 0 ? '#e5e7eb' : '#ef4444',
            color: orders.length === 0 ? '#9ca3af' : 'white',
            border: 'none',
            borderRadius: '6px',
            fontWeight: '600',
            cursor: orders.length === 0 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (orders.length > 0) {
              e.target.style.background = '#dc2626';
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (orders.length > 0) {
              e.target.style.background = '#ef4444';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }
          }}
          title={orders.length === 0 ? 'No orders to clear' : 'Clear all notifications'}
        >
          <Trash2 size={16} />
          Clear All
        </button>

        {/* Cancel Button */}
        <button
          onClick={onClose}
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            background: '#e5e7eb',
            color: '#374151',
            border: 'none',
            borderRadius: '6px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#d1d5db';
            e.target.style.transform = 'translateY(-1px)';
            e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = '#e5e7eb';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }}
          title="Close notifications panel"
        >
          <X size={16} />
          Cancel
        </button>
      </div>
    </div>
  );
};


export default Ordernotification