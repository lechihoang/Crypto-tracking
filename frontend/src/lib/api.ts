import axios from 'axios';

// Backend API response interfaces

import {
  SignInRequest,
  SignUpRequest,
  ResetPasswordRequest,
  UpdatePasswordRequest,
  ChangePasswordRequest,
  AuthResponse,

  PortfolioHolding,
  PortfolioValue,
  CreateHoldingRequest,
  UpdateHoldingRequest,
  PortfolioResponse,

  PriceAlert,
  CreateAlertRequest,
  UpdateAlertRequest,
  AlertsResponse,

  CoinDetails,
} from '@/types';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const backendApi = axios.create({
  baseURL: BACKEND_API_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send cookies with requests
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

    return {
      data: (response.data as CoinGeckoData[]).map((coin) => ({
        id: coin.id, // Use CoinGecko string ID directly
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

    const coinData = response.data as CoinDetails & {
      tickers?: Array<Record<string, unknown>>;
    };
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
            website: Array.isArray(coinData.links?.homepage) ? coinData.links.homepage : [],
            technical_doc: Array.isArray((coinData.links as Record<string, unknown>)?.whitepaper) ? (coinData.links as Record<string, unknown>).whitepaper as string[] : [],
            twitter: coinData.links?.twitter_screen_name ? [`https://twitter.com/${coinData.links.twitter_screen_name}`] : [],
            reddit: coinData.links?.subreddit_url ? [coinData.links.subreddit_url] : [],
            message_board: Array.isArray(coinData.links?.official_forum_url) ? coinData.links.official_forum_url : [],
            announcement: Array.isArray(coinData.links?.announcement_url) ? coinData.links.announcement_url : [],
            chat: Array.isArray(coinData.links?.chat_url) ? coinData.links.chat_url : [],
            explorer: Array.isArray(coinData.links?.blockchain_site) ? coinData.links.blockchain_site : [],
            source_code: Array.isArray(coinData.links?.repos_url?.github) ? coinData.links.repos_url.github : [],
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
    const response = await backendApi.get(`/crypto/${ids}/market`);
    if (response.status !== 200) throw new Error('Failed to fetch quotes');

    const marketData = response.data;
    return {
      data: {
        [ids]: {
          id: marketData.id || ids, // Use string ID from CoinGecko
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
};


export const authApi = {
  async signIn(credentials: SignInRequest): Promise<AuthResponse> {
    try {
      const response = await backendApi.post('/auth/signin', credentials);

      if (response.data.user) {
        return response.data;
      }

      return { error: 'Đăng nhập thất bại' };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string }; status?: number } };
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
      const response = await backendApi.post('/auth/change-password', data);
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
      const response = await backendApi.get('/auth/me');

      return {
        user: {
          id: response.data.id,
          email: response.data.email,
          name: response.data.name,
          picture: response.data.picture,
        },
      };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        error: err.response?.data?.message || 'Lấy thông tin người dùng thất bại'
      };
    }
  },

  async signOut(): Promise<void> {
    if (typeof window !== 'undefined') {
      try {
        await backendApi.post('/auth/logout');
      } catch (error) {
      }
    }
  },

  async isAuthenticated(): Promise<boolean> {
    try {
      const response = await backendApi.get('/auth/me');
      return !!response.data?.id;
    } catch {
      return false;
    }
  },

  loginWithGoogle(): void {
    window.location.href = `${BACKEND_API_URL}/auth/google`;
  },

  handleAuthCallback(params: URLSearchParams): AuthResponse {
    const error = params.get('error');
    if (error) {
      return { error: decodeURIComponent(error) };
    }

    const success = params.get('success');
    const userId = params.get('user_id');
    const email = params.get('email');
    const name = params.get('name');
    const picture = params.get('picture');

    if (success === 'true' && userId && email) {
      return {
        user: {
          id: userId,
          email,
          name: name || undefined,
          picture: picture || undefined,
        },
      };
    }

    return { error: 'Invalid callback parameters' };
  }
};


export const alertsApi = {
  async createAlert(alertData: CreateAlertRequest): Promise<AlertsResponse<PriceAlert[]>> {
    try {
      const response = await backendApi.post('/alerts', alertData);
      return { data: [response.data] };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        error: err.response?.data?.message || 'Tạo cảnh báo thất bại'
      };
    }
  },

  async getAlerts(): Promise<AlertsResponse<PriceAlert[]>> {
    try {
      const response = await backendApi.get('/alerts');
      return { data: response.data };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        error: err.response?.data?.message || 'Lấy danh sách cảnh báo thất bại'
      };
    }
  },

  async deleteAlert(alertId: string): Promise<AlertsResponse<void>> {
    try {
      const response = await backendApi.delete(`/alerts/${alertId}`);
      return { message: response.data.message };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        error: err.response?.data?.message || 'Xóa cảnh báo thất bại'
      };
    }
  },

  async toggleAlert(alertId: string, isActive: boolean): Promise<AlertsResponse<void>> {
    try {
      const response = await backendApi.patch(`/alerts/${alertId}/toggle`, { isActive });
      return { message: response.data.message };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        error: err.response?.data?.message || 'Cập nhật cảnh báo thất bại'
      };
    }
  },

  async getTriggeredAlerts(): Promise<AlertsResponse<PriceAlert[]>> {
    try {
      const response = await backendApi.get('/alerts/triggered');

      return { data: response.data };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        error: err.response?.data?.message || 'Lấy danh sách thông báo thất bại'
      };
    }
  },

  async updateAlert(alertId: string, data: UpdateAlertRequest): Promise<AlertsResponse<PriceAlert>> {
    try {
      const response = await backendApi.patch(`/alerts/${alertId}`, data);
      return { data: response.data };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        error: err.response?.data?.message || 'Cập nhật cảnh báo thất bại'
      };
    }
  }
};

export const portfolioApi = {
  async getHoldings(): Promise<PortfolioResponse<PortfolioHolding[]>> {
    try {
      const response = await backendApi.get('/portfolio/holdings');
      return { data: response.data };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        error: err.response?.data?.message || 'Lấy danh sách holdings thất bại'
      };
    }
  },

  async addHolding(holdingData: CreateHoldingRequest): Promise<PortfolioResponse<PortfolioHolding[]>> {
    try {
      const response = await backendApi.post('/portfolio/holdings', holdingData);
      return { data: [response.data] };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        error: err.response?.data?.message || 'Thêm holding thất bại'
      };
    }
  },

  async updateHolding(holdingId: string, holdingData: UpdateHoldingRequest): Promise<PortfolioResponse<PortfolioHolding[]>> {
    try {
      const response = await backendApi.put(`/portfolio/holdings/${holdingId}`, holdingData);
      return { data: [response.data] };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        error: err.response?.data?.message || 'Cập nhật holding thất bại'
      };
    }
  },

  async removeHolding(holdingId: string): Promise<PortfolioResponse<void>> {
    try {
      const response = await backendApi.delete(`/portfolio/holdings/${holdingId}`);
      return { message: response.data.message };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        error: err.response?.data?.message || 'Xóa holding thất bại'
      };
    }
  },

  async getPortfolioValue(): Promise<PortfolioResponse<PortfolioValue>> {
    try {
      const response = await backendApi.get('/portfolio/value');
      return { data: response.data };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        error: err.response?.data?.message || 'Lấy giá trị portfolio thất bại'
      };
    }
  },

  async getPortfolioValueHistory(days: number = 7): Promise<PortfolioResponse<unknown>> {
    try {
      const response = await backendApi.get(`/portfolio/value-history?days=${days}`);
      return { data: response.data.data };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        error: err.response?.data?.message || 'Lấy lịch sử giá trị portfolio thất bại'
      };
    }
  },

  async setBenchmark(benchmarkValue: number): Promise<PortfolioResponse<unknown>> {
    try {
      const response = await backendApi.post('/portfolio/benchmark', { benchmarkValue });
      return { data: response.data };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        error: err.response?.data?.message || 'Đặt mốc thất bại'
      };
    }
  },

  async getBenchmark(): Promise<PortfolioResponse<unknown>> {
    try {
      const response = await backendApi.get('/portfolio/benchmark');
      return { data: response.data };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        error: err.response?.data?.message || 'Lấy thông tin mốc thất bại'
      };
    }
  },

  async deleteBenchmark(): Promise<PortfolioResponse<void>> {
    try {
      const response = await backendApi.delete('/portfolio/benchmark');
      return { message: response.data.message };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        error: err.response?.data?.message || 'Xóa mốc thất bại'
      };
    }
  }
};