import React from 'react'
import './Admin.css';
import { useState } from 'react';
import { Users, Store, TrendingUp, AlertCircle, X, Eye, EyeOff, LogOut, ChevronRight, Search } from 'lucide-react';

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  'https://luxora-backend-zeta.vercel.app/api';


function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [sellers, setSellers] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tickets, setTickets] = useState([]);

  const [activeTab, setActiveTab] = useState('overview');
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);

  const initializeData = () => {
    setSellers([]);
    setUsers([]);
    setOrders([]);
    setTickets([]);
  };

  const handleLogin = () => {
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (email.includes('@') && password.length >= 6) {
      setIsAuthenticated(true);
      initializeData();
      setEmail('');
      setPassword('');
    } else {
      setError('Invalid email or password (min 6 characters)');
    }
  };

  const handleRegister = () => {
    setError('');

    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsAuthenticated(true);
    initializeData();
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setIsRegistering(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setSellers([]);
    setUsers([]);
    setOrders([]);
    setTickets([]);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setActiveTab('overview');
    setSelectedItem(null);
    setSelectedTicket(null);
    setSearchTerm('');
    setIsRegistering(false);
    setError('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      isRegistering ? handleRegister() : handleLogin();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-auth-root">
        <div className="admin-auth-card">
          <h1 className="admin-title">Admin Dashboard</h1>
          <p className="admin-sub">Manage your platform</p>

          <div className="auth-form">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                className="input"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="input"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="icon-btn"
                  aria-label="toggle password"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {isRegistering && (
              <div>
                <label className="label">Confirm Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="input"
                  placeholder="••••••••"
                />
              </div>
            )}

            {error && <div className="alert">{error}</div>}

            <button onClick={isRegistering ? handleRegister : handleLogin} className="primary-btn">
              {isRegistering ? 'Create Account' : 'Login'}
            </button>
          </div>

          <div className="auth-toggle">
            <button
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
              }}
              className="link-btn"
            >
              {isRegistering ? 'Already have an account? Login' : "Don't have an account? Register"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Total Users', value: users.length, icon: Users, colorClass: 'stat-blue' },
    { label: 'Total Sellers', value: sellers.length, icon: Store, colorClass: 'stat-green' },
    { label: 'Total Orders', value: orders.length, icon: TrendingUp, colorClass: 'stat-purple' },
    { label: 'Open Tickets', value: tickets.filter(t => t.status === 'open').length, icon: AlertCircle, colorClass: 'stat-red' },
  ];

  const confirmedOrders = orders.filter(o => o.confirmed);
  const userTickets = tickets.filter(t => t.from === 'user');
  const sellerTickets = tickets.filter(t => t.from === 'seller');

  const handleSellerApproval = (sellerId, approved) => {
    setSellers(sellers.map(s => s.id === sellerId ? { ...s, status: approved ? 'approved' : 'rejected' } : s));
  };

  const handleUpdateTicketStatus = (ticketId, newStatus) => {
    setTickets(tickets.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
    setSelectedTicket(null);
  };

  const filterItems = (items, term) => {
    return items.filter(item => JSON.stringify(item).toLowerCase().includes(term.toLowerCase()));
  };

  const OverviewTab = () => (
    <div className="overview">
      <div className="stats-grid">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="card">
              <div className="card-top">
                <div>
                  <p className="muted">{stat.label}</p>
                  <p className="big">{stat.value}</p>
                </div>
                <div className={`stat-pill ${stat.colorClass}`}>
                  <Icon size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="two-grid">
        <div className="card">
          <h2 className="card-title">Ticket Status Distribution</h2>
          <div className="space-rows">
            <div className="row-between">
              <span className="muted">Open Tickets</span>
              <span className="badge-red">{tickets.filter(t => t.status === 'open').length}</span>
            </div>
            <div className="row-between">
              <span className="muted">In Progress</span>
              <span className="badge-yellow">{tickets.filter(t => t.status === 'in-progress').length}</span>
            </div>
            <div className="row-between">
              <span className="muted">Resolved</span>
              <span className="badge-green">{tickets.filter(t => t.status === 'resolved').length}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">Orders Status</h2>
          <div className="space-rows">
            <div className="row-between">
              <span className="muted">Confirmed Orders</span>
              <span className="badge-green">{confirmedOrders.length}</span>
            </div>
            <div className="row-between">
              <span className="muted">Pending Orders</span>
              <span className="badge-yellow">{orders.filter(o => !o.confirmed).length}</span>
            </div>
            <div className="row-between">
              <span className="muted">Total Revenue</span>
              <span className="badge-blue">₹{orders.reduce((sum, o) => sum + o.amount, 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const SellerUserTab = ({ type }) => {
    const data = type === 'sellers' ? sellers : users;
    const filtered = searchTerm ? filterItems(data, searchTerm) : data;

    return (
      <div className="list-tab">
        <div className="search-row">
          <div className="search-input">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder={`Search ${type}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input search-field"
            />
          </div>
        </div>

        <div className="list-grid">
          {filtered.map(item => (
            <div
              key={item.id}
              className="list-card"
              onClick={() => setSelectedItem({ ...item, type })}
            >
              <div className="list-flex">
                <div>
                  <h3 className="list-title">{item.name}</h3>
                  <p className="muted small">{item.email}</p>
                </div>
                <ChevronRight size={20} className="muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const DetailView = () => {
    if (!selectedItem) return null;

    const isSeller = selectedItem.type === 'sellers';

    return (
      <div className="modal-backdrop" role="dialog" aria-modal="true">
        <div className="modal">
          <div className="modal-header">
            <h2 className="modal-title">{selectedItem.name} Details</h2>
            <button onClick={() => setSelectedItem(null)} className="icon-btn">
              <X size={20} />
            </button>
          </div>

          <div className="modal-body">
            <div className="grid-2">
              <div>
                <p className="muted small">Email</p>
                <p className="bold">{selectedItem.email}</p>
              </div>
              <div>
                <p className="muted small">Phone</p>
                <p className="bold">{selectedItem.phone}</p>
              </div>
              <div>
                <p className="muted small">Join Date</p>
                <p className="bold">{selectedItem.joinDate}</p>
              </div>
              <div>
                <p className="muted small">Status</p>
                <span className={`status-pill ${selectedItem.status === 'approved' || selectedItem.status === 'active' ? 'status-green' : selectedItem.status === 'pending' ? 'status-yellow' : 'status-gray'}`}>
                  {selectedItem.status}
                </span>
              </div>
            </div>

            {isSeller ? (
              <>
                <div className="divider" />
                <h3 className="sub-title">Business Information</h3>
                <div className="grid-2">
                  <div>
                    <p className="muted small">Products Listed</p>
                    <p className="big">{selectedItem.products}</p>
                  </div>
                  <div>
                    <p className="muted small">Total Revenue</p>
                    <p className="big">₹{selectedItem.revenue.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="muted small">Total Orders</p>
                    <p className="big">{selectedItem.totalOrders}</p>
                  </div>
                </div>

                {selectedItem.status === 'pending' && (
                  <div className="button-row">
                    <button onClick={() => handleSellerApproval(selectedItem.id, true)} className="success-btn">Approve</button>
                    <button onClick={() => handleSellerApproval(selectedItem.id, false)} className="danger-btn">Reject</button>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="divider" />
                <h3 className="sub-title">Customer Information</h3>
                <div className="grid-2">
                  <div>
                    <p className="muted small">Total Orders</p>
                    <p className="big">{selectedItem.orders}</p>
                  </div>
                  <div>
                    <p className="muted small">Total Spent</p>
                    <p className="big">₹{selectedItem.spent.toLocaleString()}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="muted small">Address</p>
                  <p className="bold">{selectedItem.address}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const TicketsTab = () => {
    const [ticketFilter, setTicketFilter] = useState('all');
    const filteredTickets = ticketFilter === 'all' ? tickets : ticketFilter === 'user' ? userTickets : sellerTickets;

    return (
      <div className="tickets-tab">
        <div className="filter-row">
          {['all', 'user', 'seller'].map(filter => (
            <button
              key={filter}
              onClick={() => setTicketFilter(filter)}
              className={`filter-btn ${ticketFilter === filter ? 'filter-active' : ''}`}
            >
              {filter === 'all' ? 'All Tickets' : filter === 'user' ? `User Tickets (${userTickets.length})` : `Seller Tickets (${sellerTickets.length})`}
            </button>
          ))}
        </div>

        <div className="list-grid">
          {filteredTickets.map(ticket => (
            <div key={ticket.id} className="ticket-card" onClick={() => setSelectedTicket(ticket)}>
              <div className="ticket-top">
                <div className="ticket-tags">
                  <span className={`tag ${ticket.priority === 'high' ? 'tag-red' : 'tag-yellow'}`}>{ticket.priority.toUpperCase()}</span>
                  <span className={`tag ${ticket.status === 'open' ? 'tag-red' : ticket.status === 'in-progress' ? 'tag-yellow' : 'tag-green'}`}>{ticket.status.toUpperCase()}</span>
                </div>
                <span className="muted small">{ticket.date}</span>
              </div>
              <h3 className="list-title">{ticket.subject}</h3>
              <p className="muted small">From: {ticket.name} (Order: {ticket.orderId})</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const TicketDetailModal = () => {
    if (!selectedTicket) return null;

    return (
      <div className="modal-backdrop" role="dialog" aria-modal="true">
        <div className="modal">
          <div className="modal-header">
            <h2 className="modal-title">{selectedTicket.subject}</h2>
            <button onClick={() => setSelectedTicket(null)} className="icon-btn">
              <X size={20} />
            </button>
          </div>

          <div className="modal-body">
            <div className="grid-3">
              <div>
                <p className="muted small">From</p>
                <p className="bold capitalize">{selectedTicket.from}</p>
              </div>
              <div>
                <p className="muted small">Status</p>
                <p className="bold capitalize">{selectedTicket.status}</p>
              </div>
              <div>
                <p className="muted small">Order ID</p>
                <p className="bold">{selectedTicket.orderId}</p>
              </div>
            </div>

            <div className="divider" />

            <p className="muted small mb-1">Message</p>
            <p className="message">{selectedTicket.message}</p>

            <div className="button-row">
              {selectedTicket.status !== 'resolved' && (
                <>
                  <button onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'in-progress')} className="warning-btn">In Progress</button>
                  <button onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'resolved')} className="success-btn">Resolve</button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-root">
      <div className="topbar">
        <div className="container">
          <div>
            <h1 className="top-title">Admin Dashboard</h1>
            <p className="muted small">Manage sellers, users, orders and support tickets</p>
          </div>
          <button onClick={handleLogout} className="danger-btn top-logout">
            <LogOut size={16} /> <span className="logout-text">Logout</span>
          </button>
        </div>
      </div>

      <div className="subbar">
        <div className="container tabs">
          {['overview', 'sellers', 'users', 'tickets'].map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSearchTerm(''); }}
              className={`tab-btn ${activeTab === tab ? 'tab-active' : ''}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="container main-content">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'sellers' && <SellerUserTab type="sellers" />}
        {activeTab === 'users' && <SellerUserTab type="users" />}
        {activeTab === 'tickets' && <TicketsTab />}
      </div>

      <DetailView />
      <TicketDetailModal />
    </div>
  );
}

export default Admin