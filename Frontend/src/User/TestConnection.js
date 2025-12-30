import React, { useState } from 'react';
import { Loader, CheckCircle, XCircle, RefreshCw, Server, Database, ShoppingCart, Package } from 'lucide-react';

const BackendConnectionTester = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState(null);

  const BACKEND_URL = 'https://luxora-backend-zeta.vercel.app/api';

  const endpoints = [
    { name: 'Health Check', url: '/health', method: 'GET', icon: Server },
    { name: 'Products', url: '/products', method: 'GET', icon: Package },
    { name: 'Cart (requires auth)', url: '/cart', method: 'GET', icon: ShoppingCart },
  ];

  const testEndpoint = async (endpoint) => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token && endpoint.url === '/cart') {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${BACKEND_URL}${endpoint.url}`, {
        method: endpoint.method,
        headers,
      });

      const data = await response.json();

      return {
        name: endpoint.name,
        status: response.ok ? 'success' : 'error',
        statusCode: response.status,
        data: data,
        error: null
      };
    } catch (error) {
      return {
        name: endpoint.name,
        status: 'error',
        statusCode: 0,
        data: null,
        error: error.message
      };
    }
  };

  const runTests = async () => {
    setTesting(true);
    setResults(null);

    const testResults = [];
    
    for (const endpoint of endpoints) {
      const result = await testEndpoint(endpoint);
      testResults.push(result);
    }

    setResults(testResults);
    setTesting(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px 20px'
    }}>
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '40px'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '20px',
            marginBottom: '20px'
          }}>
            <Database size={40} color="white" />
          </div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '10px'
          }}>
            Backend Connection Tester
          </h1>
          <p style={{
            fontSize: '18px',
            color: '#6b7280'
          }}>
            Test connection to: <strong>{BACKEND_URL}</strong>
          </p>
        </div>

        {/* Test Button */}
        <div style={{
          textAlign: 'center',
          marginBottom: '40px'
        }}>
          <button
            onClick={runTests}
            disabled={testing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '16px 32px',
              background: testing ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: '600',
              cursor: testing ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
            }}
          >
            {testing ? (
              <>
                <Loader className="animate-spin" size={24} />
                Testing...
              </>
            ) : (
              <>
                <RefreshCw size={24} />
                Run Connection Tests
              </>
            )}
          </button>
        </div>

        {/* Results */}
        {results && (
          <div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              Test Results
            </h2>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              {results.map((result, index) => (
                <div
                  key={index}
                  style={{
                    background: result.status === 'success' ? '#f0fdf4' : '#fef2f2',
                    border: `2px solid ${result.status === 'success' ? '#86efac' : '#fca5a5'}`,
                    borderRadius: '12px',
                    padding: '20px'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '15px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '40px',
                        height: '40px',
                        background: result.status === 'success' ? '#86efac' : '#fca5a5',
                        borderRadius: '8px'
                      }}>
                        {endpoints[index].icon && React.createElement(endpoints[index].icon, {
                          size: 24,
                          color: result.status === 'success' ? '#166534' : '#991b1b'
                        })}
                      </div>
                      <div>
                        <h3 style={{
                          fontSize: '18px',
                          fontWeight: '600',
                          color: '#1f2937',
                          margin: '0'
                        }}>
                          {result.name}
                        </h3>
                        <p style={{
                          fontSize: '14px',
                          color: '#6b7280',
                          margin: '2px 0 0 0'
                        }}>
                          {endpoints[index].url}
                        </p>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <span style={{
                        padding: '6px 12px',
                        background: result.status === 'success' ? '#166534' : '#991b1b',
                        color: 'white',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}>
                        {result.statusCode}
                      </span>
                      {result.status === 'success' ? (
                        <CheckCircle size={28} color="#16a34a" />
                      ) : (
                        <XCircle size={28} color="#dc2626" />
                      )}
                    </div>
                  </div>

                  {result.error && (
                    <div style={{
                      padding: '12px',
                      background: '#fee2e2',
                      borderRadius: '8px',
                      marginTop: '10px'
                    }}>
                      <p style={{
                        fontSize: '14px',
                        color: '#991b1b',
                        margin: '0',
                        fontWeight: '500'
                      }}>
                        ❌ Error: {result.error}
                      </p>
                    </div>
                  )}

                  {result.data && (
                    <div style={{
                      marginTop: '15px',
                      padding: '15px',
                      background: 'white',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <p style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#6b7280',
                        marginBottom: '8px'
                      }}>
                        Response Data:
                      </p>
                      <pre style={{
                        fontSize: '12px',
                        color: '#374151',
                        margin: '0',
                        overflow: 'auto',
                        maxHeight: '200px',
                        padding: '10px',
                        background: '#f9fafb',
                        borderRadius: '6px'
                      }}>
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Summary */}
            <div style={{
              marginTop: '30px',
              padding: '20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              color: 'white',
              textAlign: 'center'
            }}>
              <p style={{
                fontSize: '18px',
                fontWeight: '600',
                margin: '0'
              }}>
                ✅ {results.filter(r => r.status === 'success').length} / {results.length} endpoints working
              </p>
            </div>
          </div>
        )}

        {/* Configuration Info */}
        <div style={{
          marginTop: '40px',
          padding: '20px',
          background: '#f9fafb',
          borderRadius: '12px',
          border: '2px dashed #d1d5db'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '15px'
          }}>
            📋 Configuration Check
          </h3>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '10px',
              background: 'white',
              borderRadius: '6px'
            }}>
              <span style={{ color: '#6b7280', fontWeight: '500' }}>Backend URL:</span>
              <span style={{ color: '#1f2937', fontWeight: '600' }}>{BACKEND_URL}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '10px',
              background: 'white',
              borderRadius: '6px'
            }}>
              <span style={{ color: '#6b7280', fontWeight: '500' }}>Auth Token:</span>
              <span style={{ color: '#1f2937', fontWeight: '600' }}>
                {localStorage.getItem('token') ? '✅ Present' : '❌ Missing'}
              </span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '10px',
              background: 'white',
              borderRadius: '6px'
            }}>
              <span style={{ color: '#6b7280', fontWeight: '500' }}>Environment:</span>
              <span style={{ color: '#1f2937', fontWeight: '600' }}>
                {process.env.REACT_APP_ENV || 'development'}
              </span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div style={{
          marginTop: '30px',
          padding: '20px',
          background: '#eff6ff',
          borderRadius: '12px',
          border: '2px solid #bfdbfe'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#1e40af',
            marginBottom: '15px'
          }}>
            💡 Troubleshooting Tips
          </h3>
          <ul style={{
            margin: '0',
            paddingLeft: '20px',
            color: '#1e40af',
            lineHeight: '1.8'
          }}>
            <li>Check if your <code>.env.local</code> has <code>REACT_APP_API_URL</code> set correctly</li>
            <li>Ensure CORS is enabled on your backend for your frontend domain</li>
            <li>For protected endpoints, login first to get an auth token</li>
            <li>Check browser console for detailed error messages</li>
            <li>Verify your backend is actually running on Vercel</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BackendConnectionTester;