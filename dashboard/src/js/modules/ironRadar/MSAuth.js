//import * as msal from '@azure/msal-browser';
import { PublicClientApplication } from '@azure/msal-browser';

// MSAL configuration
const msalConfig = {
    auth: {
        clientId: '26345f26-ab9b-49a8-8ae1-724821348258',
        authority: 'https://login.microsoftonline.com/599a411f-b08b-45fe-8545-623369f42d16',
        //redirectUri: 'https://radar.festratus.com/auth/callback',
        //redirectUri: 'http://52.190.15.20:8080/dashboard.html',
        redirectUri: 'https://radar.festratus.com/auth/callback',
    },
    cache: {
        cacheLocation: 'sessionStorage', // This can be 'localStorage' or 'sessionStorage'
        storeAuthStateInCookie: false,
    },
};

export const msalInstance = new PublicClientApplication(msalConfig);

export const initializeMsal = async () => {
  await msalInstance.initialize();
};

export const login = async () => {
  try {
    await msalInstance.loginRedirect({
      scopes: ['User.Read'], // Adjust scopes as needed
    });
    // Redirect will happen automatically
  } catch (error) {
    console.error('Login error:', error);
  }
};

export const logout = () => {
  msalInstance.logoutRedirect({
    postLogoutRedirectUri: window.location.origin + '/login.html',
  });
};



