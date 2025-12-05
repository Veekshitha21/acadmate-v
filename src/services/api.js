const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend-domain.com/api' 
  : 'http://localhost:5001/api';

class ApiService {
  static async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('token');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }
      
      return data;
    } catch (error) {
      throw new Error(error.message || 'Network error');
    }
  }

  static async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  static async login(credentials) {
  return this.request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}


  static async getProfile() {
    return this.request('/auth/profile');
  }

   static async sendReminderEmail(email, eventTitle, eventDate) {
    return this.request('/reminder/send', {
      method: 'POST',
      body: JSON.stringify({ email, eventTitle, eventDate }),
    });
  }

}

export default ApiService;