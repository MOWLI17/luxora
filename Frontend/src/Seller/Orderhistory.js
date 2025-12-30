import React from 'react'
import { useState } from 'react';
import { X} from 'lucide-react';






const Orderhistory = ({orders, onClose}) => {
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredOrders = statusFilter === 'all'
    ? orders
    : orders.filter(o => o.status.toLowerCase() === statusFilter.toLowerCase());

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '900px',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px rgba(0,0,0,0.15)'
      }}>
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          background: 'white'
        }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>📋 Order History</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
            {['all', 'Processing', 'Shipped', 'Delivered'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: statusFilter === status ? '#10b981' : '#e5e7eb',
                  color: statusFilter === status ? 'white' : '#374151',
                  cursor: 'pointer',
                  fontWeight: '500',
                  textTransform: 'capitalize'
                }}
              >
                {status}
              </button>
            ))}
          </div>

          {filteredOrders.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>No orders found</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>Order ID</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>Customer</th>
                  <th style={{ textAlign: 'right', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>Amount</th>
                  <th style={{ textAlign: 'center', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>Status</th>
                  <th style={{ textAlign: 'center', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, idx) => (
                  <tr key={order._id} style={{ borderBottom: '1px solid #e5e7eb', background: idx % 2 === 0 ? '#f9fafb' : 'white' }}>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace', fontWeight: '500' }}>#{order._id.substring(0, 6)}</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>{order.customerName}</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: '#10b981', textAlign: 'right' }}>₹{order.totalAmount}</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', textAlign: 'center' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '4px',
                        background: order.status === 'Delivered' ? '#d1fae5' : '#fef3c7',
                        color: order.status === 'Delivered' ? '#065f46' : '#92400e',
                        fontWeight: '600',
                        fontSize: '0.75rem'
                      }}>
                        {order.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', textAlign: 'center', color: '#6b7280' }}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};


export default Orderhistory