import { 
    authService, 
    productService, 
    cartService, 
    orderService,
    getErrorMessage 
  } from '../Api/services';
  
  // Example in a Login component
  const handleLogin = async (emailOrMobile, password) => {
    try {
      const response = await authService.login(emailOrMobile, password);
      const { user, token } = response.data;
      
      // User and token are already saved by services.js
      setCurrentUser(user);
      navigate('/User/dashboard');
    } catch (error) {
      alert(getErrorMessage(error));
    }
  };
  
  // Example in a Product component
  const loadProducts = async () => {
    try {
      const response = await productService.getAll({ category: 'Electronics' });
      setProducts(response.data.products);
    } catch (error) {
      alert(getErrorMessage(error));
    }
  };
  
  // Example in a Cart component
  const addProductToCart = async (productId, quantity) => {
    try {
      const response = await cartService.addToCart(productId, quantity);
      alert('Product added to cart!');
      // Update cart state
    } catch (error) {
      alert(getErrorMessage(error));
    }
  };