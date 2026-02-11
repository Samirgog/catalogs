// Example usage of Telegram auth hook
import { useTelegramAuth } from '../useTelegramAuth';

// Example component showing how to use the auth system
export const AuthExampleComponent = () => {
  // Initialize auth (will auto-detect Telegram initData)
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    error, 
    login, 
    logout 
  } = useTelegramAuth();

  // Get current user info (alternative way to access user data)
  // const { user: currentUser, isAuthenticated: isAuth } = useCurrentUser();

  const handleManualLogin = async () => {
    try {
      // Manual login with custom initData
      const userData = await login('your-telegram-init-data-here');
      console.log('Logged in user:', userData);
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  if (isLoading) {
    return <div>Loading authentication...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (isAuthenticated) {
    return (
      <div>
        <h2>Welcome, {user?.first_name}!</h2>
        <p>User ID: {user?.id}</p>
        <p>Telegram ID: {user?.telegram_id}</p>
        <button onClick={logout}>Logout</button>
      </div>
    );
  }

  return (
    <div>
      <h2>Please authenticate</h2>
      <button onClick={handleManualLogin}>Login with Telegram</button>
    </div>
  );
};