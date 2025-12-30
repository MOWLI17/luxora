import React from 'react'
import { useState } from 'react';
import { ShoppingCart, Trash2, Plus, Minus, X , Check,MapPin,Edit2} from 'lucide-react';
import Swal from 'sweetalert2';
import './CssPages/Cart.css';


const Cart = ({ cart, onRemoveFromCart, onIncreaseQuantity, onDecreaseQuantity, onCheckout, onClose, onClearCart, currentUser }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash on delivery');
  const [showAddressConfirm, setShowAddressConfirm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [tempAddress, setTempAddress] = useState(null);

  // ✅ Calculate total
  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      const price = item.product?.price || item.price || 0;
      const quantity = item.quantity || 1;
      return total + (price * quantity);
    }, 0);
  };

  // ✅ Get display address
  const getDisplayAddress = () => {
    const addr = tempAddress || currentUser?.address;
    if (!addr) return 'No address provided';
    
    return `${addr.addressLine1 || addr.address || ''}, ${addr.city || ''}, ${addr.state || ''} - ${addr.zipCode || ''}`;
  };

  // ✅ Handle address edit
  const handleEditAddress = () => {
    setTempAddress(currentUser?.address || {});
    setEditingAddress(true);
  };

  // ✅ Handle address change
  const handleAddressChange = (field, value) => {
    setTempAddress(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // ✅ Confirm address and show payment method
  const handleAddressConfirm = () => {
    const address = tempAddress || currentUser?.address;
    
    if (!address?.addressLine1 && !address?.address) {
      Swal.fire({
        title: 'Address Required',
        text: 'Please enter a valid address',
        icon: 'warning',
        confirmButtonColor: '#6366f1',
      });
      return;
    }

    if (!address?.city) {
      Swal.fire({
        title: 'City Required',
        text: 'Please enter your city',
        icon: 'warning',
        confirmButtonColor: '#6366f1',
      });
      return;
    }

    if (!address?.zipCode) {
      Swal.fire({
        title: 'Zip Code Required',
        text: 'Please enter your zip code',
        icon: 'warning',
        confirmButtonColor: '#6366f1',
      });
      return;
    }

    setEditingAddress(false);
    setShowAddressConfirm(false);
  };

  // ✅ FIXED: Proper checkout handler with payment method support
  const handleBalanceConfirm = async () => {
    console.log('========== CART CHECKOUT START ==========');
    console.log('1️⃣ Raw cart from state:', JSON.stringify(cart, null, 2));
    console.log('2️⃣ Cart length:', cart.length);
    console.log('3️⃣ Current user:', currentUser?.name);
    console.log('4️⃣ Selected payment method:', selectedPaymentMethod);

    if (cart.length === 0) {
      Swal.fire({
        title: 'Cart is Empty!',
        text: 'Please add items before checking out.',
        icon: 'warning',
        confirmButtonColor: '#6366f1',
      });
      return;
    }

    if (!currentUser) {
      Swal.fire({
        title: 'Please Login',
        text: 'You must login to complete your purchase.',
        icon: 'warning',
        confirmButtonColor: '#6366f1',
      });
      return;
    }

    // ✅ Show address confirmation first
    if (!showAddressConfirm) {
      setShowAddressConfirm(true);
      return;
    }

    try {
      setIsProcessing(true);

      // ✅ FORMAT CART ITEMS
      console.log('5️⃣ Formatting cart items...');
      
      const cartItems = cart.map((item, idx) => {
        const productId = item.product?._id || item.product?.id || item._id || item.id;
        const quantity = parseInt(item.quantity) || 1;
        const price = parseFloat(item.product?.price || item.price) || 0;
        const name = item.product?.name || item.name || `Product ${idx + 1}`;

        const formattedItem = {
          productId: String(productId),
          quantity: quantity,
          price: price,
          name: name
        };

        console.log(`   Formatted item ${idx}:`, formattedItem);
        return formattedItem;
      });

      console.log('6️⃣ All items formatted:', JSON.stringify(cartItems, null, 2));

      // ✅ CALCULATE TOTAL
      const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      console.log('7️⃣ Total amount calculated:', totalAmount);

      // ✅ Use updated address if edited, otherwise use current
      const finalAddress = tempAddress || currentUser?.address || {};

      // ✅ BUILD CORRECT PAYLOAD WITH SELECTED PAYMENT METHOD
      const orderPayload = {
        cartItems: cartItems,
        paymentMethod: selectedPaymentMethod,
        totalAmount: totalAmount,
        
        // ✅ FIXED: Correct shipping address structure
        shippingAddress: {
          fullName: currentUser.name || 'Customer',
          address: finalAddress.addressLine1 || finalAddress.address || 'Address Not Provided',
          city: finalAddress.city || 'City',
          state: finalAddress.state || 'State',
          zipCode: finalAddress.zipCode || '000000',
          country: finalAddress.country || 'India',
          phone: currentUser.mobile || '0000000000'
        },
        
        // Optional fields
        userId: currentUser._id || currentUser.id,
        userEmail: currentUser.email,
        userName: currentUser.name,
        paymentIntentId: null
      };

      console.log('8️⃣ Complete CORRECTED payload:', JSON.stringify(orderPayload, null, 2));
      console.log('📞 Calling onCheckout with payload...');

      // ✅ CALL PARENT HANDLER WITH PAYLOAD
      await onCheckout(orderPayload);

      console.log('========== CART CHECKOUT END (SUCCESS) ==========\n');

      // ✅ Reset states after successful checkout
      setShowAddressConfirm(false);
      setTempAddress(null);

    } catch (error) {
      console.error('❌ Checkout error:', error);
      console.log('Error stack:', error.stack);
      console.log('========== CART CHECKOUT END (ERROR) ==========\n');

      Swal.fire({
        title: 'Checkout Error',
        text: error.message || 'Failed to process checkout',
        icon: 'error',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const total = calculateTotal();

  return (
    <div className="cart-overlay">
      <div className="cart-container">
        <div className="cart-header">
          <h2>🛒 Shopping Cart ({cart.length} items)</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="cart-empty">
            <ShoppingCart size={64} />
            <p>Your cart is empty</p>
            <button onClick={onClose} className="btn-continue">
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            {!showAddressConfirm ? (
              <>
                <div className="cart-items">
                  {cart.map((item, idx) => {
                    const price = item.product?.price || item.price || 0;
                    const name = item.product?.name || item.name || 'Product';
                    const image = item.product?.images?.[0] || item.image || '/placeholder.jpg';
                    const productId = item.product?._id || item.product?.id || item._id || item.id;
                    const quantity = item.quantity || 1;
                    const itemTotal = price * quantity;

                    return (
                      <div key={idx} className="cart-item">
                        <img 
                          src={image} 
                          alt={name} 
                          className="item-image" 
                          onError={(e) => { e.target.src = '/placeholder.jpg'; }} 
                        />
                        
                        <div className="item-details">
                          <h3 className="item-name">{name}</h3>
                          <p className="item-price">₹{price.toLocaleString()}</p>
                          <p className="item-id" style={{ fontSize: '12px', color: '#999' }}>
                            ID: {productId}
                          </p>
                        </div>

                        <div className="item-quantity">
                          <button 
                            onClick={() => onDecreaseQuantity(productId)}
                            className="qty-btn"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="qty-value">{quantity}</span>
                          <button 
                            onClick={() => onIncreaseQuantity(productId)}
                            className="qty-btn"
                          >
                            <Plus size={16} />
                          </button>
                        </div>

                        <div className="item-total">
                          <p>₹{itemTotal.toLocaleString()}</p>
                        </div>

                        <button 
                          onClick={() => onRemoveFromCart(productId)}
                          className="remove-btn"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="cart-summary">
                  <div className="summary-row">
                    <span>Subtotal:</span>
                    <span>₹{total.toLocaleString()}</span>
                  </div>
                  <div className="summary-row">
                    <span>Shipping:</span>
                    <span>Free</span>
                  </div>
                  <div className="summary-row total">
                    <span>Total:</span>
                    <span>₹{total.toLocaleString()}</span>
                  </div>
                </div>

                {/* ✅ PAYMENT METHOD SELECTOR */}
                <div className="payment-method-selector">
                  <h3>💳 Select Payment Method:</h3>
                  <div className="payment-options">
                    <label className="payment-option">
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        value="cash on delivery"
                        checked={selectedPaymentMethod === 'cash on delivery'}
                        onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                      />
                      <span className="payment-label">💵 Cash on Delivery (COD)</span>
                      <span className="payment-status active">✓ Available</span>
                    </label>
                    
                    <label className="payment-option">
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        value="card"
                        disabled
                      />
                      <span className="payment-label">💳 Credit/Debit Card</span>
                      <span className="payment-status">🔄 Coming Soon</span>
                    </label>
                    
                    <label className="payment-option">
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        value="upi"
                        disabled
                      />
                      <span className="payment-label">📱 UPI Payment</span>
                      <span className="payment-status">🔄 Coming Soon</span>
                    </label>
                    
                    <label className="payment-option">
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        value="wallet"
                        disabled
                      />
                      <span className="payment-label">👛 Digital Wallet</span>
                      <span className="payment-status">🔄 Coming Soon</span>
                    </label>
                  </div>
                </div>

                <div className="cart-actions">
                  <button 
                    onClick={onClearCart}
                    className="btn-clear"
                  >
                    🗑️ Clear Cart
                  </button>
                  <button 
                    onClick={onClose}
                    className="btn-continue"
                  >
                    Continue Shopping
                  </button>
                  <button 
                    onClick={handleBalanceConfirm}
                    disabled={isProcessing || cart.length === 0}
                    className="btn-checkout"
                  >
                    {isProcessing ? '⏳ Processing...' : '💳 Proceed to Checkout'}
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* ✅ ADDRESS CONFIRMATION SCREEN */}
                <div className="address-confirmation-screen">
                  <div className="address-header">
                    <MapPin size={28} className="address-icon" />
                    <h2>Delivery Address</h2>
                  </div>

                  {!editingAddress ? (
                    <div className="address-display">
                      <div className="address-box">
                        <h3>{currentUser?.name || 'Customer'}</h3>
                        <p>{getDisplayAddress()}</p>
                        <p className="phone">📱 {currentUser?.mobile || 'N/A'}</p>
                      </div>
                      <button 
                        onClick={handleEditAddress}
                        className="btn-edit-address"
                      >
                        <Edit2 size={18} /> Edit Address
                      </button>
                    </div>
                  ) : (
                    <div className="address-form">
                      <div className="form-group">
                        <label>Address Line 1</label>
                        <input 
                          type="text" 
                          value={tempAddress?.addressLine1 || tempAddress?.address || ''}
                          onChange={(e) => handleAddressChange('addressLine1', e.target.value)}
                          placeholder="Enter your address"
                        />
                      </div>

                      <div className="form-group">
                        <label>City</label>
                        <input 
                          type="text" 
                          value={tempAddress?.city || ''}
                          onChange={(e) => handleAddressChange('city', e.target.value)}
                          placeholder="Enter your city"
                        />
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>State</label>
                          <input 
                            type="text" 
                            value={tempAddress?.state || ''}
                            onChange={(e) => handleAddressChange('state', e.target.value)}
                            placeholder="State"
                          />
                        </div>
                        <div className="form-group">
                          <label>Zip Code</label>
                          <input 
                            type="text" 
                            value={tempAddress?.zipCode || ''}
                            onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                            placeholder="000000"
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Country</label>
                        <input 
                          type="text" 
                          value={tempAddress?.country || 'India'}
                          onChange={(e) => handleAddressChange('country', e.target.value)}
                          placeholder="Country"
                        />
                      </div>
                    </div>
                  )}

                  {/* Order Summary on Address Screen */}
                  <div className="order-summary">
                    <h3>Order Summary</h3>
                    <div className="summary-items">
                      {cart.map((item, idx) => (
                        <div key={idx} className="summary-item">
                          <span>{item.product?.name || item.name} × {item.quantity}</span>
                          <span>₹{((item.product?.price || item.price) * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    <div className="summary-total">
                      <span>Total Amount:</span>
                      <span>₹{total.toLocaleString()}</span>
                    </div>
                    <div className="payment-info">
                      <p><strong>Payment Method:</strong> {selectedPaymentMethod === 'cash on delivery' ? '💵 Cash on Delivery' : selectedPaymentMethod}</p>
                    </div>
                  </div>

                  <div className="address-actions">
                    <button 
                      onClick={() => setShowAddressConfirm(false)}
                      className="btn-back"
                    >
                      ← Back to Cart
                    </button>
                    <button 
                      onClick={handleBalanceConfirm}
                      disabled={isProcessing}
                      className="btn-confirm-address"
                    >
                      {editingAddress ? (
                        <>
                          <Check size={18} /> Save Address & Continue
                        </>
                      ) : (
                        <>
                          <Check size={18} /> Confirm & Place Order
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Cart