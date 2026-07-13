export const login = async () => {
    try {
      const loginResponse = await msalInstance.loginPopup({
        scopes: ['User.Read'], // Define scopes as needed
      });
      console.log('Login successful:', loginResponse);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };
  
  export const logout = () => {
    msalInstance.logout();
  };
  
  export const getToken = async () => {
    const account = msalInstance.getAllAccounts()[0];
  
    if (!account) {
      throw new Error('No accounts logged in');
    }
  
    try {
      const response = await msalInstance.acquireTokenSilent({
        scopes: ['User.Read'],
        account,
      });
      return response.accessToken;
    } catch (error) {
      console.error('Token acquisition failed:', error);
      // Fallback to interactive method if silent acquisition fails
      const response = await msalInstance.acquireTokenPopup({
        scopes: ['User.Read'],
      });
      return response.accessToken;
    }
  };