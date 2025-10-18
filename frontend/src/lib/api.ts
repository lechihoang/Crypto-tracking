import axios from 'axios';

// Backend API response interfaces
interface BackendCoinData {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  market_cap_rank?: number;
}

interface BackendCoinDetailData {
  id: string;
  name: string;
  symbol: string;
  description?: { en?: string };
  image?: { large?: string };
  links?: {
    homepage?: string[];
    whitepaper?: string[];
    twitter_screen_name?: string;
    subreddit_url?: string;
    official_forum_url?: string[];
    announcement_url?: string[];
    chat_url?: string[];
    blockchain_site?: string[];
    repos_url?: { github?: string[] };
  };
  market_data?: {
    current_price?: { usd?: number };
    price_change_percentage_24h?: number;
    market_cap?: { usd?: number };
  };
  market_cap_rank?: number;
}

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const backendApi = axios.create({
  baseURL: BACKEND_API_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

export const clientApi = {
  async getLatestListings(limit: number = 100, page: number = 1) {
    const response = await backendApi.get(`/crypto/top?limit=${limit}&page=${page}`);
    if (response.status !== 200) throw new Error('Failed to fetch listings');

    interface CoinGeckoData {
      id: string;
      name: string;
      symbol: string;
      image?: string;
      current_price: number;
      market_cap: number;
      market_cap_rank?: number;
      total_volume?: number;
      circulating_supply?: number;
      total_supply?: number;
      max_supply?: number;
      last_updated?: string;
      price_change_percentage_1h_in_currency?: number;
      price_change_percentage_24h?: number;
      price_change_percentage_7d_in_currency?: number;
      fully_diluted_valuation?: number;
      sparkline_in_7d?: {
        price: number[];
      };
    }

    // Transform backend response to match frontend expectations
    return {
      data: (response.data as CoinGeckoData[]).map((coin, index: number) => ({
        id: index + 1, // Use index as numeric ID for compatibility
        name: coin.name,
        symbol: coin.symbol,
        slug: coin.id, // Store the string ID in slug field
        image: coin.image, // Store the image URL from CoinGecko
        cmc_rank: coin.market_cap_rank || 1,
        num_market_pairs: 0,
        circulating_supply: coin.circulating_supply || 0,
        total_supply: coin.total_supply || 0,
        max_supply: coin.max_supply || 0,
        last_updated: coin.last_updated || new Date().toISOString(),
        date_added: new Date().toISOString(),
        tags: [],
        platform: null,
        sparkline_in_7d: coin.sparkline_in_7d,
        quote: {
          USD: {
            price: coin.current_price,
            volume_24h: coin.total_volume || 0,
            volume_change_24h: 0,
            percent_change_1h: coin.price_change_percentage_1h_in_currency || 0,
            percent_change_24h: coin.price_change_percentage_24h || 0,
            percent_change_7d: coin.price_change_percentage_7d_in_currency || 0,
            percent_change_30d: 0,
            market_cap: coin.market_cap,
            market_cap_dominance: 0,
            fully_diluted_market_cap: coin.fully_diluted_valuation || coin.market_cap,
            last_updated: coin.last_updated || new Date().toISOString(),
          }
        }
      }))
    };
  },

  async getCoinInfo(id: string) {
    const response = await backendApi.get(`/crypto/${id}`);
    if (response.status !== 200) throw new Error('Failed to fetch coin info');

    const coinData = response.data as BackendCoinDetailData & {
      tickers?: any[];
    };
    // Transform backend response to match frontend expectations
    return {
      data: {
        [id]: {
          id: parseInt(id) || 1,
          name: coinData.name,
          symbol: coinData.symbol,
          category: '',
          description: coinData.description?.en || '',
          slug: coinData.id,
          logo: coinData.image?.large || '',
          subreddit: '',
          notice: '',
          tags: [],
          tag_names: [],
          tag_groups: [],
          urls: {
            website: coinData.links?.homepage || [],
            technical_doc: coinData.links?.whitepaper || [],
            twitter: coinData.links?.twitter_screen_name ? [`https://twitter.com/${coinData.links.twitter_screen_name}`] : [],
            reddit: coinData.links?.subreddit_url ? [coinData.links.subreddit_url] : [],
            message_board: coinData.links?.official_forum_url || [],
            announcement: coinData.links?.announcement_url || [],
            chat: coinData.links?.chat_url || [],
            explorer: coinData.links?.blockchain_site || [],
            source_code: coinData.links?.repos_url?.github || [],
            facebook: [],
          },
          platform: null,
          date_added: new Date().toISOString(),
          twitter_username: coinData.links?.twitter_screen_name || '',
          is_hidden: 0,
          date_launched: new Date().toISOString(),
          contract_address: [],
          self_reported_circulating_supply: 0,
          self_reported_tags: null,
          self_reported_market_cap: 0,
          num_market_pairs: coinData.tickers?.length || 0,
        }
      }
    };
  },

  async getQuotes(ids: string) {
    // Get market data from the new endpoint
    const response = await backendApi.get(`/crypto/${ids}/market`);
    if (response.status !== 200) throw new Error('Failed to fetch quotes');

    const marketData = response.data;
    // Transform backend response to match frontend expectations
    return {
      data: {
        [ids]: {
          id: parseInt(ids) || 1,
          name: marketData.name,
          symbol: marketData.symbol,
          slug: marketData.id,
          cmc_rank: marketData.market_cap_rank || 1,
          num_market_pairs: 0,
          circulating_supply: marketData.circulating_supply || 0,
          total_supply: marketData.total_supply || 0,
          max_supply: marketData.max_supply || 0,
          last_updated: marketData.last_updated || new Date().toISOString(),
          date_added: new Date().toISOString(),
          tags: [],
          platform: null,
          quote: {
            USD: {
              price: marketData.current_price || 0,
              volume_24h: marketData.total_volume || 0,
              volume_change_24h: 0,
              percent_change_1h: marketData.price_change_percentage_1h_in_currency || 0,
              percent_change_24h: marketData.price_change_percentage_24h || 0,
              percent_change_7d: marketData.price_change_percentage_7d_in_currency || 0,
              percent_change_30d: marketData.price_change_percentage_30d_in_currency || 0,
              market_cap: marketData.market_cap || 0,
              market_cap_dominance: 0,
              fully_diluted_market_cap: marketData.fully_diluted_valuation || marketData.market_cap || 0,
              last_updated: marketData.last_updated || new Date().toISOString(),
            }
          }
        }
      }
    };
  },

  async getCoinPriceHistory(coinId: string, days: number = 7) {
    const response = await backendApi.get(`/crypto/${coinId}/history?days=${days}`);
    if (response.status !== 200) throw new Error('Failed to fetch price history');
    return response.data;
  },

  async getCoinInfoVietnamese(id: string) {
    const response = await backendApi.get(`/crypto/${id}/vi`);
    if (response.status !== 200) throw new Error('Failed to fetch coin info in Vietnamese');

    const coinData = response.data as BackendCoinDetailData & {
      description?: { vi?: string };
      tickers?: any[];
    };
    // Transform backend response to match frontend expectations
    return {
      data: {
        [id]: {
          id: parseInt(id) || 1,
          name: coinData.name,
          symbol: coinData.symbol,
          category: '',
          description: coinData.description?.vi || coinData.description?.en || '',
          slug: coinData.id,
          logo: coinData.image?.large || '',
          subreddit: '',
          notice: '',
          tags: [],
          tag_names: [],
          tag_groups: [],
          urls: {
            website: coinData.links?.homepage || [],
            technical_doc: coinData.links?.whitepaper || [],
            twitter: coinData.links?.twitter_screen_name ? [`https://twitter.com/${coinData.links.twitter_screen_name}`] : [],
            reddit: coinData.links?.subreddit_url ? [coinData.links.subreddit_url] : [],
            message_board: coinData.links?.official_forum_url || [],
            announcement: coinData.links?.announcement_url || [],
            chat: coinData.links?.chat_url || [],
            explorer: coinData.links?.blockchain_site || [],
            source_code: coinData.links?.repos_url?.github || [],
            facebook: [],
          },
          platform: null,
          date_added: new Date().toISOString(),
          twitter_username: coinData.links?.twitter_screen_name || '',
          is_hidden: 0,
          date_launched: new Date().toISOString(),
          contract_address: [],
          self_reported_circulating_supply: 0,
          self_reported_tags: null,
          self_reported_market_cap: 0,
          num_market_pairs: coinData.tickers?.length || 0,
        }
      }
    };
  },
};

// Auth API interfaces
interface SignInRequest {
  email: string;
  password: string;
}

interface SignUpRequest {
  email: string;
  password: string;
  fullName?: string;
}

interface ResetPasswordRequest {
  email: string;
}

interface UpdatePasswordRequest {
  password: string;
  accessToken: string;
}

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

interface AuthResponse {
  user?: {
    id: string;
    email: string;
    full_name?: string;
  };
  access_token?: string;
  message?: string;
  error?: string;
}

// Auth API client using backend
export const authApi = {
  async signIn(credentials: SignInRequest): Promise<AuthResponse> {
    try {
      const response = await backendApi.post('/auth/signin', credentials);

      if (response.data.access_token) {
        localStorage.setItem('auth_token', response.data.access_token);
        this.syncTokenToCookie(response.data.access_token);
        return response.data;
      }

      return { error: 'Đăng nhập thất bại' };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        error: err.response?.data?.message || 'Đăng nhập thất bại'
      };
    }
  },

  async signUp(userData: SignUpRequest): Promise<AuthResponse> {
    try {
      const response = await backendApi.post('/auth/signup', {
        email: userData.email,
        password: userData.password,
        fullName: userData.fullName,
      });

      return {
        message: response.data.message || 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.',
      };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        error: err.response?.data?.message || 'Đăng ký thất bại'
      };
    }
  },

  async resetPassword(data: ResetPasswordRequest): Promise<AuthResponse> {
    try {
      const response = await backendApi.post('/auth/reset-password', data);
      return { message: response.data.message || 'Email đặt lại mật khẩu đã được gửi!' };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        error: err.response?.data?.message || 'Gửi email đặt lại mật khẩu thất bại'
      };
    }
  },

  async updatePassword(data: UpdatePasswordRequest): Promise<AuthResponse> {
    try {
      const response = await backendApi.post('/auth/update-password', data);
      return { message: response.data.message || 'Mật khẩu đã được cập nhật thành công!' };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        error: err.response?.data?.message || 'Cập nhật mật khẩu thất bại'
      };
    }
  },

  async changePassword(data: ChangePasswordRequest): Promise<AuthResponse> {
    try {
      const token = this.getToken();
      if (!token) {
        return { error: 'Không tìm thấy token xác thực' };
      }

      const response = await backendApi.post('/auth/change-password', data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return { message: response.data.message || 'Đổi mật khẩu thành công!' };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        error: err.response?.data?.message || 'Đổi mật khẩu thất bại'
      };
    }
  },

  async getProfile(): Promise<AuthResponse> {
    try {
      const token = this.getToken();
      if (!token) {
        return { error: 'Không tìm thấy token xác thực' };
      }

      const response = await backendApi.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });

      return {
        user: {
          id: response.data.id,
          email: response.data.email,
          full_name: response.data.user_metadata?.full_name,
        },
      };
    } catch (error: unknown) {
      this.signOut();
      const err = error as { response?: { data?: { message?: string } } };
      return {
        error: err.response?.data?.message || 'Lấy thông tin người dùng thất bại'
      };
    }
  },

  signOut(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      // Remove cookie
      document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/';
    }
  },

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  // Helper to sync token to cookies for middleware
  syncTokenToCookie(token: string): void {
    if (typeof window !== 'undefined') {
      document.cookie = `auth_token=${token}; path=/; secure; samesite=strict`;
    }
  }
};

// Price Alerts API interfaces
interface PriceAlert {
  id: string;
  userId: string;
  coinId: number;
  coinSymbol: string;
  coinName: string;
  condition: 'above' | 'below';
  targetPrice: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateAlertRequest {
  coinId: number;
  coinSymbol: string;
  coinName: string;
  condition: 'above' | 'below';
  targetPrice: number;
}

interface AlertsResponse {
  data?: PriceAlert[];
  error?: string;
  message?: string;
}

// Price Alerts API client
export const alertsApi = {
  async createAlert(alertData: CreateAlertRequest): Promise<AlertsResponse> {
    try {
      const token = authApi.getToken();
      if (!token) {
        return { error: 'Không tìm thấy token xác thực' };
      }

      const response = await backendApi.post('/alerts', alertData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return { data: [response.data] };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        error: err.response?.data?.message || 'Tạo cảnh báo thất bại'
      };
    }
  },

  async getAlerts(): Promise<AlertsResponse> {
    try {
      const token = authApi.getToken();
      if (!token) {
        return { error: 'Không tìm thấy token xác thực' };
      }

      const response = await backendApi.get('/alerts', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return { data: response.data };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        error: err.response?.data?.message || 'Lấy danh sách cảnh báo thất bại'
      };
    }
  },

  async deleteAlert(alertId: string): Promise<AlertsResponse> {
    try {
      const token = authApi.getToken();
      if (!token) {
        return { error: 'Không tìm thấy token xác thực' };
      }

      const response = await backendApi.delete(`/alerts/${alertId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return { message: response.data.message };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        error: err.response?.data?.message || 'Xóa cảnh báo thất bại'
      };
    }
  },

  async toggleAlert(alertId: string, isActive: boolean): Promise<AlertsResponse> {
    try {
      const token = authApi.getToken();
      if (!token) {
        return { error: 'Không tìm thấy token xác thực' };
      }

      const response = await backendApi.patch(`/alerts/${alertId}/toggle`,
        { isActive },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return { message: response.data.message };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        error: err.response?.data?.message || 'Cập nhật cảnh báo thất bại'
      };
    }
  }
};

// Portfolio API interfaces
interface PortfolioHolding {
  id: string;
  userId: string;
  coinId: string;
  coinSymbol: string;
  coinName: string;
  quantity: number;
  averageBuyPrice?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateHoldingRequest {
  coinId: string;
  coinSymbol: string;
  coinName: string;
  coinImage?: string;
  quantity: number;
  averageBuyPrice?: number;
  notes?: string;
}

interface UpdateHoldingRequest {
  quantity?: number;
  averageBuyPrice?: number;
  notes?: string;
}

interface PortfolioValue {
  totalValue: number;
  holdings: Array<{
    holding: PortfolioHolding;
    currentPrice: number;
    currentValue: number;
    profitLoss?: number;
    profitLossPercentage?: number;
  }>;
}

interface PortfolioSnapshot {
  id: string;
  userId: string;
  totalValue: number;
  snapshotDate: string;
}

interface PortfolioResponse {
  data?: PortfolioHolding[] | PortfolioValue | PortfolioSnapshot[];
  error?: string;
  message?: string;
}

// Portfolio API client
export const portfolioApi = {
  async getHoldings(): Promise<PortfolioResponse> {
    try {
      const token = authApi.getToken();
      if (!token) {
        return { error: 'Không tìm thấy token xác thực' };
      }

      const response = await backendApi.get('/portfolio/holdings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return { data: response.data };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        error: err.response?.data?.message || 'Lấy danh sách holdings thất bại'
      };
    }
  },

  async addHolding(holdingData: CreateHoldingRequest): Promise<PortfolioResponse> {
    try {
      const token = authApi.getToken();
      if (!token) {
        return { error: 'Không tìm thấy token xác thực' };
      }

      const response = await backendApi.post('/portfolio/holdings', holdingData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return { data: [response.data] };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        error: err.response?.data?.message || 'Thêm holding thất bại'
      };
    }
  },

  async updateHolding(holdingId: string, holdingData: UpdateHoldingRequest): Promise<PortfolioResponse> {
    try {
      const token = authApi.getToken();
      if (!token) {
        return { error: 'Không tìm thấy token xác thực' };
      }

      const response = await backendApi.put(`/portfolio/holdings/${holdingId}`, holdingData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return { data: [response.data] };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        error: err.response?.data?.message || 'Cập nhật holding thất bại'
      };
    }
  },

  async removeHolding(holdingId: string): Promise<PortfolioResponse> {
    try {
      const token = authApi.getToken();
      if (!token) {
        return { error: 'Không tìm thấy token xác thực' };
      }

      const response = await backendApi.delete(`/portfolio/holdings/${holdingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return { message: response.data.message };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        error: err.response?.data?.message || 'Xóa holding thất bại'
      };
    }
  },

  async getPortfolioValue(): Promise<PortfolioResponse> {
    try {
      const token = authApi.getToken();
      if (!token) {
        return { error: 'Không tìm thấy token xác thực' };
      }

      const response = await backendApi.get('/portfolio/value', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return { data: response.data };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        error: err.response?.data?.message || 'Lấy giá trị portfolio thất bại'
      };
    }
  },

  async getPortfolioHistory(days: number = 30): Promise<PortfolioResponse> {
    try {
      const token = authApi.getToken();
      if (!token) {
        return { error: 'Không tìm thấy token xác thực' };
      }

      const response = await backendApi.get(`/portfolio/history?days=${days}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return { data: response.data };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        error: err.response?.data?.message || 'Lấy lịch sử portfolio thất bại'
      };
    }
  },

  async createSnapshot(): Promise<PortfolioResponse> {
    try {
      const token = authApi.getToken();
      if (!token) {
        return { error: 'Không tìm thấy token xác thực' };
      }

      const response = await backendApi.post('/portfolio/snapshot', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return { data: [response.data] };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        error: err.response?.data?.message || 'Tạo snapshot thất bại'
      };
    }
  },

  async getPortfolioValueHistory(days: number = 7): Promise<PortfolioResponse> {
    try {
      const token = authApi.getToken();
      if (!token) {
        return { error: 'Không tìm thấy token xác thực' };
      }

      const response = await backendApi.get(`/portfolio/value-history?days=${days}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return { data: response.data.data };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        error: err.response?.data?.message || 'Lấy lịch sử giá trị portfolio thất bại'
      };
    }
  },

  async setBenchmark(benchmarkValue: number): Promise<PortfolioResponse> {
    try {
      const token = authApi.getToken();
      if (!token) {
        return { error: 'Không tìm thấy token xác thực' };
      }

      const response = await backendApi.post('/portfolio/benchmark',
        { benchmarkValue },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return { data: response.data };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        error: err.response?.data?.message || 'Đặt mốc thất bại'
      };
    }
  },

  async getBenchmark(): Promise<PortfolioResponse> {
    try {
      const token = authApi.getToken();
      if (!token) {
        return { error: 'Không tìm thấy token xác thực' };
      }

      const response = await backendApi.get('/portfolio/benchmark', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return { data: response.data };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        error: err.response?.data?.message || 'Lấy thông tin mốc thất bại'
      };
    }
  },

  async deleteBenchmark(): Promise<PortfolioResponse> {
    try {
      const token = authApi.getToken();
      if (!token) {
        return { error: 'Không tìm thấy token xác thực' };
      }

      const response = await backendApi.delete('/portfolio/benchmark', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return { message: response.data.message };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        error: err.response?.data?.message || 'Xóa mốc thất bại'
      };
    }
  }
};