import React from 'react'
import { useState } from 'react';
import { ShoppingBag, Store, ChevronRight, Sparkles } from 'lucide-react';
const Welcompage = ({onCustomerSelect, onSellerSelect}) => {
  const [hoveredRole, setHoveredRole] = useState(null);

  const roles = [
    {
      id: 'customer',
      title: 'I am a Customer',
      icon: ShoppingBag,
      proverb: '"Shop with confidence, find what you love"',
      description:
        'Discover amazing products, enjoy exclusive deals, and shop from the comfort of your home.',
      benefits: [
        'Browse thousands of products',
        'Exclusive discounts and offers',
        'Fast shipping & easy returns',
        'Secure payments',
        'Wishlist & saved items',
      ],
      color: '#667eea',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      action: onCustomerSelect,
    },
    {
      id: 'seller',
      title: 'I am a Seller',
      icon: Store,
      proverb: '"Turn your products into profits"',
      description:
        'Start your business journey with our platform. Reach millions of buyers and grow your sales.',
      benefits: [
        'Easy product listing',
        'Real-time analytics',
        'Secure payment gateway',
        'Marketing tools',
        'Dedicated support',
      ],
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      action: onSellerSelect,
    },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
      }}
    >
      <div style={{ maxWidth: '1200px', width: '100%' }}>
        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginBottom: '1rem',
            }}
          >
            <Sparkles size={32} style={{ color: '#667eea' }} />
            <h1
              style={{
                fontSize: '2.5rem',
                fontWeight: '700',
                background:
                  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                margin: 0,
              }}
            >
              Welcome to LUXORA
            </h1>
          </div>

          <p
            style={{
              fontSize: '1.1rem',
              color: '#64748b',
              marginBottom: '1rem',
              maxWidth: '600px',
              margin: '0 auto 1rem',
            }}
          >
            Choose your role and unlock a world of possibilities
          </p>

          <p
            style={{
              fontSize: '0.95rem',
              color: '#94a3b8',
              fontStyle: 'italic',
              margin: 0,
            }}
          >
            "Every great marketplace begins with a choice to either buy or sell"
          </p>
        </div>

        {/* Role Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '2rem',
            marginBottom: '2rem',
          }}
        >
          {roles.map((role) => {
            const Icon = role.icon;
            const isHovered = hoveredRole === role.id;

            return (
              <button
                key={role.id}
                onClick={role.action}
                onMouseEnter={() => setHoveredRole(role.id)}
                onMouseLeave={() => setHoveredRole(null)}
                style={{
                  background: 'white',
                  border: 'none',
                  borderRadius: '1rem',
                  padding: '2rem',
                  cursor: 'pointer',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isHovered
                    ? `0 20px 40px rgba(0, 0, 0, 0.1)`
                    : '0 4px 6px rgba(0, 0, 0, 0.07)',
                  transform: isHovered
                    ? 'translateY(-12px) scale(1.02)'
                    : 'translateY(0)',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {isHovered && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: role.gradient,
                      opacity: 0.05,
                      pointerEvents: 'none',
                    }}
                  />
                )}

                <div style={{ position: 'relative', zIndex: 1 }}>
                  {/* Icon */}
                  <div
                    style={{
                      width: '80px',
                      height: '80px',
                      background: role.gradient,
                      borderRadius: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1.5rem',
                      transition: 'all 0.3s',
                    }}
                  >
                    <Icon size={40} style={{ color: 'white' }} />
                  </div>

                  <h2
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: '700',
                      color: '#1e293b',
                      margin: '0 0 0.75rem 0',
                    }}
                  >
                    {role.title}
                  </h2>

                  <p
                    style={{
                      fontSize: '0.9rem',
                      color: role.color,
                      fontWeight: '600',
                      fontStyle: 'italic',
                      margin: '0 0 1rem 0',
                    }}
                  >
                    {role.proverb}
                  </p>

                  <p
                    style={{
                      fontSize: '0.95rem',
                      color: '#64748b',
                      lineHeight: '1.6',
                      margin: '0 0 1.5rem 0',
                    }}
                  >
                    {role.description}
                  </p>

                  <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
                    {role.benefits.map((benefit, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          marginBottom: '0.5rem',
                          fontSize: '0.9rem',
                          color: '#475569',
                        }}
                      >
                        <div
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: role.color,
                          }}
                        />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    style={{
                      width: '100%',
                      padding: '0.875rem 1.5rem',
                      background: role.gradient,
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
                    }}
                  >
                    Continue as{' '}
                    {role.id === 'customer' ? 'Customer' : 'Seller'}
                    <ChevronRight size={20} />
                  </button>
                </div>
              </button>
            );
          })}
        </div>

        <div
          style={{
            textAlign: 'center',
            color: '#64748b',
            fontSize: '0.9rem',
          }}
        >
          <p>
            Not sure?{' '}
            <span style={{ color: '#667eea', fontWeight: '600' }}>
              You can switch later in your profile settings
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};


export default Welcompage