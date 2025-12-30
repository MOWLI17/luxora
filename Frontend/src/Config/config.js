// src/Config/config.js
const getApiUrl = () => {
  // Priority 1: Environment variable
  if (process.env.REACT_APP_API_URL) {
    console.log('[CONFIG] Using API URL from .env:', process.env.REACT_APP_API_URL);
    return process.env.REACT_APP_API_URL;
  }
  
  // Priority 2: Default to Vercel production URL
  return 'https://luxora-backend-sigma.vercel.app/api';
};

export const API_URL = getApiUrl();

export const config = {
  API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
};

export default config;