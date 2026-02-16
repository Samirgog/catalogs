import type { AuthResponse, User } from './types';

const AUTH_FUNCTION_URL = 'https://dqqyvnwqrfbfdleldbvq.supabase.co/functions/v1/catalogs-auth-function';

export const telegramAuthService = {
  /**
   * Authenticate user via Telegram initData
   * @param initData - Telegram WebApp initData string
   * @returns User object from successful authentication
   */
  async authenticate(initData: string): Promise<AuthResponse> {
    try {
      const response = await fetch(AUTH_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ initData }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Authentication failed: ${response.status} - ${errorText}`);
      }

      const userData = await response.json();

      return userData;
    } catch (error) {
      console.error('Telegram auth error:', error);
      throw error;
    }
  },

  /**
   * Validate if user is authenticated
   * @returns boolean indicating if user is authenticated
   */
  isAuthenticated(): boolean {
    // Check if we have a valid user in localStorage/sessionStorage
    const storedUser = localStorage.getItem('telegram_user');
    if (!storedUser) return false;
    
    try {
      const user: User = JSON.parse(storedUser);
      // Check if user data is valid
      return !!(user.id && user.telegram_id && user.first_name);
    } catch {
      return false;
    }
  },

  /**
   * Get stored user data
   * @returns User object or null if not found/invalid
   */
  getStoredUser(): User | null {
    const storedUser = localStorage.getItem('telegram_user');
    if (!storedUser) return null;
    
    try {
      return JSON.parse(storedUser);
    } catch {
      return null;
    }
  },

  /**
   * Store user data in localStorage
   * @param user - User object to store
   */
  storeUser(user: User): void {
    localStorage.setItem('telegram_user', JSON.stringify(user));
  },

  /**
   * Clear stored user data
   */
  clearStoredUser(): void {
    localStorage.removeItem('telegram_user');
  }
};