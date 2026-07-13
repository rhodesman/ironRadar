import { msalInstance, initializeMsal, logout } from './modules/ironRadar/MSAuth';

const startDashboard = async () => {
  await initializeMsal();

  const accounts = msalInstance.getAllAccounts();

  if (accounts.length === 0) {
    // Not authenticated
    window.location.href = 'login.html';
  } else {
    // Authenticated
    console.log('User is logged in:', accounts[0]);

    // Attach logout handler
    const logoutButton = document.getElementById('logoutButton');
    logoutButton.addEventListener('click', logout);

    // Optionally fetch user data here
  }
};

startDashboard();