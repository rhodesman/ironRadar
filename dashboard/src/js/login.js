import { msalInstance, initializeMsal, login } from './modules/ironRadar/MSAuth';

const startLogin = async () => {
  await initializeMsal();

  const loginButton = document.getElementById('loginButton');
  loginButton.addEventListener('click', login);

  const response = await msalInstance.handleRedirectPromise();

  if (response) {
    // Successful login
    window.location.href = 'dashboard.html';
  }
};

startLogin();