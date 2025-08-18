// api.js - Improved version with better error handling and consistency
import { getToken } from "./auth";

const API_BASE = "http://127.0.0.1:5000";

// Centralized error handling
class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Enhanced headers function
function authHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

// Centralized fetch wrapper with error handling
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: authHeaders(),
    ...options
  };

  try {
    console.log(`🌐 API Request: ${options.method || 'GET'} ${endpoint}`);
    
    const response = await fetch(url, config);
    
    // Handle different response types
    const contentType = response.headers.get('content-type');
    let data = null;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      console.error(`❌ API Error ${response.status}:`, data);
      
      // Extract error message from response
      const errorMessage = data?.error || data?.message || data || `HTTP ${response.status}`;
      throw new ApiError(errorMessage, response.status, data);
    }

    console.log(`✅ API Success: ${endpoint}`, data);
    return data;

  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network or other errors
    console.error(`🔥 Network Error:`, error);
    throw new ApiError(`Network error: ${error.message}`, 0);
  }
}

// ===================
// TRANSACTION APIs
// ===================

export async function getTransactions(filters = {}) {
  const queryParams = new URLSearchParams();
  
  // Add filters as query parameters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      queryParams.append(key, value);
    }
  });
  
  const endpoint = `/transactions${queryParams.toString() ? `?${queryParams}` : ''}`;
  return apiRequest(endpoint);
}

export async function getUserTransactions() {
  return apiRequest('/transactions/user');
}

export async function addTransaction(data) {
  return apiRequest('/transactions', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

// ===================
// BALANCE & SUMMARY APIs
// ===================

export async function getBalance() {
  return apiRequest('/balance');
}

export async function getSummary() {
  return apiRequest('/summary');
}

export async function getMonthlySummary(month) {
  return apiRequest(`/monthly-summary?month=${month}`);
}

export async function getCategoryBreakdown(type = 'expense') {
  return apiRequest(`/category-breakdown?type=${type}`);
}

export async function getMonthlyIncomeExpense() {
  return apiRequest('/monthly-income-expense');
}

export async function getMonthlyBalance() {
  return apiRequest('/monthly-balance');
}

export async function getSummaryByCategory() {
  return apiRequest('/summary-by-category');
}

// ===================
// BANK STATEMENT APIs
// ===================

export async function uploadBankStatement(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  return apiRequest('/upload-statement', {
    method: 'POST',
    headers: {
      // Don't set Content-Type for FormData, let browser set it
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {})
    },
    body: formData
  });
}

export async function getParsingHistory() {
  return apiRequest('/parsing-history');
}

export async function getTransactionInsights() {
  return apiRequest('/transaction-insights');
}

// ===================
// AUTH APIs
// ===================

export async function loginUser(username, password) {
  const data = await apiRequest('/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
  
  if (data.token) {
    localStorage.setItem('token', data.token);
  }
  
  return data;
}

export async function registerUser(username, password) {
  return apiRequest('/register', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
}

export async function logout() {
  localStorage.removeItem('token');
  // Could also make API call to invalidate token on server if implemented
}

// ===================
// UTILITY FUNCTIONS
// ===================

// Check if user is authenticated
export function isAuthenticated() {
  return !!getToken();
}

// Handle API errors in components
export function handleApiError(error, defaultMessage = 'An error occurred') {
  if (error instanceof ApiError) {
    return error.message;
  }
  
  console.error('Unexpected error:', error);
  return defaultMessage;
}

// Retry failed requests
export async function retryApiCall(apiFunction, maxRetries = 3, delay = 1000) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiFunction();
    } catch (error) {
      lastError = error;
      
      // Don't retry on auth errors or client errors (400-499)
      if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
        throw error;
      }
      
      if (i < maxRetries - 1) {
        console.log(`🔄 Retrying API call in ${delay}ms... (attempt ${i + 2}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }
  
  throw lastError;
}

// Batch multiple API calls
export async function batchApiCalls(apiCalls) {
  try {
    const results = await Promise.allSettled(apiCalls.map(call => call()));
    
    const successes = results
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value);
      
    const failures = results
      .filter(result => result.status === 'rejected')
      .map(result => result.reason);
    
    return { successes, failures };
  } catch (error) {
    console.error('Batch API calls failed:', error);
    throw error;
  }
}