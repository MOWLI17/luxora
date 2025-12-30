// Order Management Utilities - Silent version (no automatic alerts)

const generateOrderId = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `#${timestamp}${random}`.slice(0, 10);
  };
  
  const getCurrentDate = () => {
    const date = new Date();
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };
  
  const getStatusColor = (status) => {
    const statusColors = {
      'Processing': '#f59e0b',
      'Confirmed': '#3b82f6',
      'Shipped': '#8b5cf6',
      'In Transit': '#3b82f6',
      'Out for Delivery': '#06b6d4',
      'Delivered': '#10b981',
      'Cancelled': '#ef4444',
      'Refunded': '#6b7280'
    };
    return statusColors[status] || '#6b7280';
  };
  
  // ✅ SILENT VERSION - No automatic alerts
  export const addOrder = (cartItems, orderDetails = {}) => {
    // Validate cartItems
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      console.error('Invalid cart items provided');
      return null;
    }
  
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = orderDetails.shipping || 15.00;
    const tax = orderDetails.tax || (subtotal * 0.08);
    const total = subtotal + shipping + tax;
  
    const newOrder = {
      id: generateOrderId(),
      date: getCurrentDate(),
      items: cartItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image || null,
        description: item.description || ''
      })),
      subtotal: parseFloat(subtotal.toFixed(2)),
      shipping: parseFloat(shipping.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      status: orderDetails.status || 'Processing',
      statusColor: getStatusColor(orderDetails.status || 'Processing'),
      shippingAddress: orderDetails.shippingAddress || 'No address provided'
    };
  
    try {
      const existingOrders = JSON.parse(localStorage.getItem('customerOrders') || '[]');
      existingOrders.unshift(newOrder);
      localStorage.setItem('customerOrders', JSON.stringify(existingOrders));
      
      // ✅ Return the order without showing alerts
      return newOrder;
    } catch (error) {
      console.error('Error saving order to localStorage:', error);
      return null;
    }
  };
  
  export const getOrders = () => {
    try {
      return JSON.parse(localStorage.getItem('customerOrders') || '[]');
    } catch (error) {
      console.error('Error retrieving orders from localStorage:', error);
      return [];
    }
  };
  
  export const updateOrderStatus = (orderId, newStatus) => {
    try {
      const orders = getOrders();
      const updatedOrders = orders.map(order => {
        if (order.id === orderId) {
          return {
            ...order,
            status: newStatus,
            statusColor: getStatusColor(newStatus)
          };
        }
        return order;
      });
      localStorage.setItem('customerOrders', JSON.stringify(updatedOrders));
      return updatedOrders;
    } catch (error) {
      console.error('Error updating order status:', error);
      return [];
    }
  };
  
  export const deleteOrder = (orderId) => {
    try {
      const orders = getOrders();
      const filteredOrders = orders.filter(order => order.id !== orderId);
      localStorage.setItem('customerOrders', JSON.stringify(filteredOrders));
      return filteredOrders;
    } catch (error) {
      console.error('Error deleting order:', error);
      return [];
    }
  };
  
  export const clearAllOrders = () => {
    try {
      localStorage.removeItem('customerOrders');
      return true;
    } catch (error) {
      console.error('Error clearing orders:', error);
      return false;
    }
  };
  
  // Utility function to get order by ID
  export const getOrderById = (orderId) => {
    const orders = getOrders();
    return orders.find(order => order.id === orderId);
  };
  
  // Utility function to get orders by status
  export const getOrdersByStatus = (status) => {
    const orders = getOrders();
    return orders.filter(order => order.status === status);
  };