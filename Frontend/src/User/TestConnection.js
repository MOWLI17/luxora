import React from 'react'
import { useState } from 'react';
import { useEffect } from 'react';
import API_URL from '../Config/config'
import { CheckCircle, XCircle, Loader, RefreshCw } from 'lucide-react';
import axios from 'axios';
import {productService, getErrorMessage} from '../Api/services'


const TestConnection = () => {
    const [tests, setTests] = useState({
        serverHealth: { status: 'pending', message: '' },
        productsAPI: { status: 'pending', message: '', data: null },
        authAPI: { status: 'pending', message: '' },
      });
      const [loading, setLoading] = useState(false);
    
      const runTests = async () => {
        setLoading(true);
        const newTests = { ...tests };
    
        // Test 1: Server Health Check
        try {
          const response = await axios.get(`${API_URL.replace('/api', '')}/api/health`);
          const health = response.data;
          if (health.status === 'OK') {
            newTests.serverHealth = { 
              status: 'success', 
              message: `Server is running. MongoDB: ${health.mongoDB}` 
            };
          } else {
            newTests.serverHealth = { 
              status: 'error', 
              message: 'Server responded but status is not OK' 
            };
          }
        } catch (error) {
          newTests.serverHealth = { 
            status: 'error', 
            message: getErrorMessage(error)
          };
        }
    
        // Test 2: Products API
        try {
          const response = await productService.getAll();
          const products = response.data;
          newTests.productsAPI = { 
            status: 'success', 
            message: `Found ${products.length} products`,
            data: products
          };
        } catch (error) {
          newTests.productsAPI = { 
            status: 'error', 
            message: getErrorMessage(error),
            data: null
          };
        }
    
        // Test 3: Auth API (just check if endpoint exists)
        try {
          await axios.options(`${API_URL}/auth/login`);
          newTests.authAPI = { 
            status: 'success', 
            message: 'Auth endpoints are accessible' 
          };
        } catch (error) {
          newTests.authAPI = { 
            status: 'error', 
            message: getErrorMessage(error)
          };
        }
    
        setTests(newTests);
        setLoading(false);
      };
    
      useEffect(() => {
        runTests();
      }, []);
    
      const getStatusIcon = (status) => {
        switch (status) {
          case 'success':
            return <CheckCircle size={24} style={{ color: '#10b981' }} />;
          case 'error':
            return <XCircle size={24} style={{ color: '#ef4444' }} />;
          case 'pending':
            return <Loader size={24} className="animate-spin" style={{ color: '#6b7280' }} />;
          default:
            return null;
        }
      };
    
      return (
        <div style={{
          maxWidth: '800px',
          margin: '2rem auto',
          padding: '2rem',
          background: 'white',
          borderRadius: '1rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>
              🔧 Backend Connection Test
            </h2>
            <button
              onClick={runTests}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                background: loading ? '#d1d5db' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              <RefreshCw size={18} />
              Retest
            </button>
          </div>
    
          <div style={{
            background: '#f9fafb',
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
            color: '#374151'
          }}>
            <strong>API URL:</strong> {API_URL}
          </div>
    
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Server Health Test */}
            <div style={{
              padding: '1.5rem',
              border: '2px solid #e5e7eb',
              borderRadius: '0.75rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem'
            }}>
              {getStatusIcon(tests.serverHealth.status)}
              <div style={{ flex: 1 }}>
                <h3 style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#1f2937' }}>
                  1. Server Health Check
                </h3>
                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                  {tests.serverHealth.message || 'Testing server connectivity...'}
                </p>
              </div>
            </div>
    
            {/* Products API Test */}
            <div style={{
              padding: '1.5rem',
              border: '2px solid #e5e7eb',
              borderRadius: '0.75rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem'
            }}>
              {getStatusIcon(tests.productsAPI.status)}
              <div style={{ flex: 1 }}>
                <h3 style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#1f2937' }}>
                  2. Products API
                </h3>
                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                  {tests.productsAPI.message || 'Testing products endpoint...'}
                </p>
                {tests.productsAPI.data && tests.productsAPI.data.length > 0 && (
                  <div style={{
                    marginTop: '0.75rem',
                    padding: '0.75rem',
                    background: '#f0fdf4',
                    borderRadius: '0.5rem',
                    fontSize: '0.75rem',
                    color: '#166534'
                  }}>
                    <strong>Sample Product:</strong> {tests.productsAPI.data[0].name} - ₹{tests.productsAPI.data[0].price}
                  </div>
                )}
              </div>
            </div>
    
            {/* Auth API Test */}
            <div style={{
              padding: '1.5rem',
              border: '2px solid #e5e7eb',
              borderRadius: '0.75rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem'
            }}>
              {getStatusIcon(tests.authAPI.status)}
              <div style={{ flex: 1 }}>
                <h3 style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#1f2937' }}>
                  3. Authentication API
                </h3>
                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                  {tests.authAPI.message || 'Testing auth endpoints...'}
                </p>
              </div>
            </div>
          </div>
    
          <div style={{
            marginTop: '2rem',
            padding: '1rem',
            background: '#eff6ff',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            color: '#1e40af'
          }}>
            <strong>💡 Troubleshooting Tips:</strong>
            <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem' }}>
              <li>Make sure your backend server is running on port 5000</li>
              <li>Check that CORS is properly configured in server.js</li>
              <li>Verify MongoDB connection in backend console</li>
              <li>Ensure .env file has correct REACT_APP_API_URL</li>
              <li>Try uploading products using ProductUpload component</li>
            </ul>
          </div>
        </div>
      );
    };
export default TestConnection