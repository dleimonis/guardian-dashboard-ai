import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    // Request interceptor for auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Health check
  async checkHealth() {
    const response = await this.client.get('/health');
    return response.data;
  }

  // Disasters API
  async getDisasters() {
    const response = await this.client.get('/api/disasters');
    return response.data;
  }

  async getDisasterById(id: string) {
    const response = await this.client.get(`/api/disasters/${id}`);
    return response.data;
  }

  async getDisastersByLocation(lat: number, lon: number, radius?: number) {
    const response = await this.client.get(`/api/disasters/location/${lat}/${lon}`, {
      params: { radius },
    });
    return response.data;
  }

  async reportDisaster(disaster: any) {
    const response = await this.client.post('/api/disasters', disaster);
    return response.data;
  }

  // Alerts API
  async getAlerts(params?: { severity?: string; status?: string; limit?: number }) {
    const response = await this.client.get('/api/alerts', { params });
    return response.data;
  }

  async getAlertPreferences() {
    const response = await this.client.get('/api/alerts/preferences');
    return response.data;
  }

  async updateAlertPreferences(preferences: any) {
    const response = await this.client.put('/api/alerts/preferences', preferences);
    return response.data;
  }

  async acknowledgeAlert(id: string) {
    const response = await this.client.post(`/api/alerts/${id}/acknowledge`);
    return response.data;
  }

  async dismissAlert(id: string) {
    const response = await this.client.post(`/api/alerts/${id}/dismiss`);
    return response.data;
  }

  async getAlertStatistics() {
    const response = await this.client.get('/api/alerts/statistics');
    return response.data;
  }

  async testAlert() {
    const response = await this.client.post('/api/alerts/test');
    return response.data;
  }

  // Agents API
  async getAgentStatuses() {
    const response = await this.client.get('/api/agents/status');
    return response.data;
  }

  async getAgentStatus(name: string) {
    const response = await this.client.get(`/api/agents/${name}/status`);
    return response.data;
  }

  async runSimulation(scenario: any) {
    const response = await this.client.post('/api/agents/simulate', scenario);
    return response.data;
  }

  async getSimulationScenarios() {
    const response = await this.client.get('/api/agents/simulate/scenarios');
    return response.data;
  }

  async getAgentMetrics() {
    const response = await this.client.get('/api/agents/metrics');
    return response.data;
  }

  async restartAgent(name: string) {
    const response = await this.client.post(`/api/agents/${name}/restart`);
    return response.data;
  }

  async getAgentLogs(name: string, limit?: number) {
    const response = await this.client.get(`/api/agents/${name}/logs`, {
      params: { limit },
    });
    return response.data;
  }

  // Authentication (Descope integration)
  async verifyToken(token: string) {
    const response = await this.client.post('/api/auth/verify', { token });
    return response.data;
  }

  async getCurrentUser() {
    const response = await this.client.get('/api/auth/profile');
    return response.data;
  }

  async saveApiKeys(apiKeys: Record<string, string>) {
    const response = await this.client.post('/api/auth/save-api-keys', { apiKeys });
    return response.data;
  }

  async getApiKeys() {
    const response = await this.client.get('/api/auth/api-keys');
    return response.data;
  }

  async revokeService(service: string) {
    const response = await this.client.delete(`/api/auth/api-keys/${service}`);
    return response.data;
  }

  async getServiceStatus(service: string) {
    const response = await this.client.get(`/api/auth/services/${service}/status`);
    return response.data;
  }

  async logout() {
    localStorage.removeItem('auth_token');
    // Clear any other auth-related data
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Export types
export interface Disaster {
  id: string;
  type: 'fire' | 'earthquake' | 'weather' | 'flood' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: {
    lat: number;
    lon: number;
    name?: string;
    radius?: number;
  };
  data: any;
  timestamp: string;
}

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'watch' | 'info';
  location: string;
  timestamp: string;
  status: 'active' | 'acknowledged' | 'dismissed';
}

export interface AgentStatus {
  status: 'online' | 'warning' | 'offline' | 'error';
  message?: string;
  lastActivity?: string;
  metrics?: any;
}

export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  type: string;
  severity: string;
  location: {
    lat: number;
    lon: number;
    name: string;
  };
  data: any;
}