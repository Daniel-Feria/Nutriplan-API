const loginLink = document.querySelector('[data-login-link]');
const authenticatedLinks = document.querySelectorAll('[data-auth-required]');
const isAuthenticated = Boolean(sessionStorage.getItem('nutriplanToken'));

authenticatedLinks.forEach((link) => {
  link.hidden = !isAuthenticated;
});

if (isAuthenticated && loginLink) {
  loginLink.textContent = 'Cerrar sesión';
  loginLink.href = '/logout';
}

document.addEventListener('click', (event) => {
  const target = event.target;
  const logoutLink = target instanceof Element && target.closest('a[href="/logout"]');

  if (logoutLink) {
    sessionStorage.removeItem('nutriplanToken');
    sessionStorage.removeItem('nutriplanUser');
  }
});
