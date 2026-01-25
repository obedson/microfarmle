const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const getToken = () => {
  let token = localStorage.getItem('token');
  if (!token) {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      token = parsed.state?.token;
    }
  }
  return token;
};

export const marketplaceApi = {
  // Products
  getProducts: async (filters?: { category?: string; location?: string }) => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.location) params.append('location', filters.location);
    
    const response = await fetch(`${API_BASE}/products?${params}`);
    return response.json();
  },

  getProduct: async (id: string) => {
    const response = await fetch(`${API_BASE}/products/${id}`);
    return response.json();
  },

  createProduct: async (productData: any) => {
    const token = getToken();
    const headers: any = {
      'Authorization': `Bearer ${token}`
    };
    
    // Don't set Content-Type for FormData, let browser set it
    if (!(productData instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      productData = JSON.stringify(productData);
    }
    
    const response = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers,
      body: productData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create product');
    }
    
    return response.json();
  },

  updateProduct: async (id: string, productData: any) => {
    const token = getToken();
    const response = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(productData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update product');
    }
    
    return response.json();
  },

  deleteProduct: async (id: string) => {
    const token = getToken();
    const response = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete product');
    }
  },

  // Orders
  createOrder: async (orderData: any) => {
    const token = getToken();
    const response = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(orderData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create order');
    }
    
    return response.json();
  },

  getMyOrders: async () => {
    const token = getToken();
    const response = await fetch(`${API_BASE}/orders/my-orders`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },

  getMySales: async () => {
    const token = getToken();
    const response = await fetch(`${API_BASE}/orders/my-sales`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },

  updateOrderStatus: async (id: string, status: string) => {
    const token = getToken();
    const response = await fetch(`${API_BASE}/orders/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update order status');
    }
    
    return response.json();
  }
};
