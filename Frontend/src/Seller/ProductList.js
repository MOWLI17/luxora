import React from 'react'
import { useState,useEffect } from 'react';
import { Edit2, Trash2, Eye, Search, Filter, AlertCircle, Loader, X } from 'lucide-react';
import Swal from 'sweetalert2';
import './CssPage/ProductList.css';

const API_URL = 'https://luxora-backend-zeta.vercel.app/api';
const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [deleting, setDeleting] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({});

  const categories = [
    'Electronics',
    'Clothing',
    'Home & Garden',
    'Sports',
    'Books',
    'Toys',
    'Beauty',
    'Food'
  ];

  // Get Token from localStorage or window.storage
  const getToken = async () => {
    try {
      return window.storage?.get('sellerToken') || localStorage.getItem('sellerToken');
    } catch {
      return localStorage.getItem('sellerToken');
    }
  };

  // Fetch Products from API
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const token = await getToken();

      if (!token) {
        setError('Not authenticated');
        setProducts([]);
        return;
      }

      // ✅ FIXED: Changed from /seller/products to /seller/auth/products
      const response = await fetch(`${API_URL}/seller/auth/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();

      setProducts(data.products || []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.message || 'Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial Load
  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle Edit Click
  const handleEditClick = (product) => {
    setEditingProduct(product._id);
    setEditForm({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category: product.category
    });
  };

  // Handle Edit Form Change
  const handleEditFormChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  // Handle Edit Submit
  const handleEditSubmit = async (productId) => {
    try {
      const token = await getToken();

      if (!token) {
        Swal.fire({
          icon: 'error',
          title: 'Authentication Error',
          text: 'Not authenticated',
          confirmButtonColor: '#10b981'
        });
        return;
      }

      // ✅ FIXED: Changed from /products/:id to /seller/auth/products/:id (PUT)
      const response = await fetch(`${API_URL}/seller/auth/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      if (!response.ok) throw new Error('Failed to update product');

      setProducts(products.map(p =>
        p._id === productId ? { ...p, ...editForm } : p
      ));
      setEditingProduct(null);

      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Product updated successfully',
        confirmButtonColor: '#10b981',
        timer: 2000
      });
    } catch (err) {
      console.error('Error updating product:', err);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: err.message || 'Failed to update product',
        confirmButtonColor: '#10b981'
      });
    }
  };

  // Delete Product
  const handleDelete = async (productId) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      setDeleting(productId);
      const token = await getToken();

      if (!token) {
        Swal.fire({
          icon: 'error',
          title: 'Authentication Error',
          text: 'Not authenticated',
          confirmButtonColor: '#10b981'
        });
        return;
      }

      // ✅ FIXED: Changed from /products/:id to /seller/auth/products/:id (DELETE)
      const response = await fetch(`${API_URL}/seller/auth/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete product');

      setProducts(products.filter(p => p._id !== productId));

      Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: 'Product has been deleted.',
        confirmButtonColor: '#10b981',
        timer: 2000
      });
    } catch (err) {
      console.error('Error deleting product:', err);
      Swal.fire({
        icon: 'error',
        title: 'Delete Failed',
        text: err.message || 'Failed to delete product',
        confirmButtonColor: '#10b981'
      });
    } finally {
      setDeleting(null);
    }
  };

  // Handle View Product Details
  const handleView = async (product) => {
    await Swal.fire({
      title: product.name,
      html: `
        <div style="text-align: left;">
          ${product.images && product.images[0] ? `<img src="${product.images[0]}" style="width: 100%; max-height: 300px; object-fit: cover; border-radius: 8px; margin-bottom: 1rem;" />` : ''}
          <p><strong>Category:</strong> ${product.category}</p>
          <p><strong>Price:</strong> â‚¹${product.price.toLocaleString()}</p>
          <p><strong>Stock:</strong> ${product.stock} units</p>
          <p><strong>Description:</strong> ${product.description}</p>
        </div>
      `,
      confirmButtonColor: '#10b981',
      width: '600px'
    });
  };

  // Get Status Badge Class and Text
  const getStatusClass = (stock) => {
    if (stock === 0) return 'status-out';
    if (stock < 10) return 'status-low';
    return 'status-active';
  };

  const getStatusText = (stock) => {
    if (stock === 0) return 'Out of Stock';
    if (stock < 10) return 'Low Stock';
    return 'Active';
  };

  // Filter Products based on search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === 'all' || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Loading State
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <Loader size={48} className="loading-spinner" />
          <p className="loading-text">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="product-container">
      {/* Header */}
      <div className="product-header">
        <h1 className="product-title">ðŸ"‹ My Products</h1>
        <p className="product-subtitle">
          Manage all your store products ({products.length} total)
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="error-box">
          <AlertCircle size={20} className="error-icon" />
          <div className="error-message">{error}</div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="filter-section">
        <div className="filter-grid">
          <div className="search-wrapper">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-wrapper">
            <Filter size={20} className="filter-icon" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingProduct && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Edit Product</h2>
              <button
                className="modal-close-btn"
                onClick={() => setEditingProduct(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-form-group">
                <label className="modal-label">Product Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => handleEditFormChange('name', e.target.value)}
                  className="modal-input"
                />
              </div>

              <div className="modal-form-group">
                <label className="modal-label">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => handleEditFormChange('description', e.target.value)}
                  rows={3}
                  className="modal-textarea"
                />
              </div>

              <div className="modal-form-row">
                <div className="modal-form-group">
                  <label className="modal-label">Price (â‚¹)</label>
                  <input
                    type="number"
                    value={editForm.price}
                    onChange={(e) => handleEditFormChange('price', Number(e.target.value))}
                    className="modal-input"
                  />
                </div>

                <div className="modal-form-group">
                  <label className="modal-label">Stock</label>
                  <input
                    type="number"
                    value={editForm.stock}
                    onChange={(e) => handleEditFormChange('stock', Number(e.target.value))}
                    className="modal-input"
                  />
                </div>
              </div>

              <div className="modal-form-group">
                <label className="modal-label">Category</label>
                <select
                  value={editForm.category}
                  onChange={(e) => handleEditFormChange('category', e.target.value)}
                  className="modal-select"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-buttons">
                <button
                  className="modal-btn-save"
                  onClick={() => handleEditSubmit(editingProduct)}
                >
                  Save Changes
                </button>
                <button
                  className="modal-btn-cancel"
                  onClick={() => setEditingProduct(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="product-table-container">
        {filteredProducts.length === 0 ? (
          <div className="no-products-message">
            <AlertCircle size={64} className="no-products-icon" />
            <p className="no-products-title">No products found</p>
            <p className="no-products-subtitle">
              {products.length === 0
                ? 'Start by uploading your first product!'
                : 'Try adjusting your search filters.'}
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="products-table">
              <thead>
                <tr className="table-header">
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product, index) => (
                  <tr
                    key={product._id}
                    className={`table-row ${index % 2 === 0 ? 'row-even' : 'row-odd'}`}
                  >
                    <td className="cell-product">
                      <div className="product-info">
                        {product.images && product.images[0] && (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="product-img"
                            onError={(e) => {
                              e.target.src =
                                'https://via.placeholder.com/40x40?text=Product';
                            }}
                          />
                        )}
                        <span className="product-name">{product.name}</span>
                      </div>
                    </td>
                    <td className="cell-category">
                      <span className="product-category">{product.category}</span>
                    </td>
                    <td className="cell-price">
                      <span className="product-price">
                        â‚¹{product.price.toLocaleString()}
                      </span>
                    </td>
                    <td className="cell-stock">
                      <span className="product-stock">{product.stock} units</span>
                    </td>
                    <td className="cell-status">
                      <span className={`status-badge ${getStatusClass(product.stock)}`}>
                        {getStatusText(product.stock)}
                      </span>
                    </td>
                    <td className="cell-actions">
                      <div className="action-buttons">
                        <button
                          title="View"
                          className="btn-action btn-view"
                          onClick={() => handleView(product)}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          title="Edit"
                          className="btn-action btn-edit"
                          onClick={() => handleEditClick(product)}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          title="Delete"
                          className="btn-action btn-delete"
                          onClick={() => handleDelete(product._id)}
                          disabled={deleting === product._id}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {products.length > 0 && (
        <div className="stats-grid">
          <div className="stat-card stat-card-primary">
            <p className="stat-label">Total Products</p>
            <p className="stat-value">{products.length}</p>
          </div>
          <div className="stat-card stat-card-info">
            <p className="stat-label">Active Products</p>
            <p className="stat-value">
              {products.filter(p => p.stock > 0).length}
            </p>
          </div>
          <div className="stat-card stat-card-warning">
            <p className="stat-label">Low Stock</p>
            <p className="stat-value">
              {products.filter(p => p.stock > 0 && p.stock < 10).length}
            </p>
          </div>
          <div className="stat-card stat-card-error">
            <p className="stat-label">Out of Stock</p>
            <p className="stat-value">
              {products.filter(p => p.stock === 0).length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList