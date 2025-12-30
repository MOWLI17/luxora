import React from 'react'
import { useEffect,useState } from 'react';
import {  Package, DollarSign, ShoppingBag, Users } from 'lucide-react';

import './CssPage/Analytics.css';

const API_URL = 'https://luxora-backend-sigma.vercel.app/api';

const Analytics = ({ products = [], confirmedOrders = [] }) => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalInventoryValue: 0,
    totalOrders: 0,
    activeCustomers: 0,
    avgOrderValue: 0,
    conversionRate: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    const calculateStats = () => {
      const totalProducts = products.length;
      const totalInventoryValue = products.reduce((sum, p) => sum + (parseInt(p.price) || 0), 0);
      const totalOrders = confirmedOrders.length;
      const totalRevenue = confirmedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
      const activeCustomers = new Set(confirmedOrders.map(o => o.customerName)).size;
      const conversionRate = totalProducts > 0 ? Math.round((totalOrders / totalProducts) * 100) : 0;

      setStats({
        totalProducts,
        totalInventoryValue,
        totalOrders,
        activeCustomers,
        avgOrderValue,
        conversionRate,
        totalRevenue
      });
    };

    calculateStats();
  }, [products, confirmedOrders]);

  const topProducts = products
    .sort((a, b) => parseInt(b.price) - parseInt(a.price))
    .slice(0, 5);

  const kpiCards = [
    { label: 'Total Products', value: stats.totalProducts, color: '#10b981', icon: Package },
    { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, color: '#059669', icon: DollarSign },
    { label: 'Total Orders', value: stats.totalOrders, color: '#047857', icon: ShoppingBag },
    { label: 'Active Customers', value: stats.activeCustomers, color: '#065f46', icon: Users }
  ];

  return (
    <div style={{ padding: '2rem', background: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#111827' }}>📊 Analytics</h1>
        <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>Track your store performance</p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', borderLeft: `4px solid ${kpi.color}`, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>{kpi.label}</p>
                  <p style={{ fontSize: '2rem', fontWeight: '700', color: kpi.color, marginTop: '0.5rem' }}>{kpi.value}</p>
                  <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '0.5rem' }}>Current stats</p>
                </div>
                <Icon size={32} style={{ color: `${kpi.color}40` }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>Avg Order Value</h3>
          <p style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981' }}>₹{stats.avgOrderValue.toLocaleString()}</p>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '0.5rem' }}>Average per order</p>
        </div>

        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>Conversion Rate</h3>
          <p style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981' }}>{stats.conversionRate}%</p>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '0.5rem' }}>Orders vs Products</p>
        </div>

        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>Top Products</h3>
          {topProducts.length > 0 ? (
            <div>
              {topProducts.map((product, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: idx < topProducts.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{product.name}</span>
                  <span style={{ color: '#10b981', fontWeight: '600' }}>₹{product.price}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#9ca3af' }}>No products</p>
          )}
        </div>
      </div>
    </div>
  );
};




export default Analytics