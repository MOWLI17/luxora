const getApiUrl = () => {
  // Priority 1: Environment variable
  if (process.env.REACT_APP_API_URL) {
    console.log('[CONFIG] Using API URL from .env:', process.env.REACT_APP_API_URL);
    return process.env.REACT_APP_API_URL;
  }
  
  // Priority 2: Development
  if (process.env.NODE_ENV === 'development') {
    const devUrl = 'http://localhost:5000/api';
    console.log('[CONFIG] Using development API URL:', devUrl);
    return devUrl;
  }
  
  // Priority 3: Production fallback
  const prodUrl = 'https://luxora-backend-zeta.vercel.app/api';
  console.log('[CONFIG] Using production API URL:', prodUrl);
  return prodUrl;
};

export const API_URL = getApiUrl();

export const config = {
  API_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json'
  }
};

console.log('[CONFIG] API Configuration:');
console.log('[CONFIG] - API_URL:', API_URL);
console.log('[CONFIG] - Environment:', process.env.NODE_ENV);
console.log('[CONFIG] - Timeout:', config.timeout, 'ms');

export default config;
