const loginLink = document.querySelector('[data-login-link]');

if (sessionStorage.getItem('nutriplanToken') && loginLink) {
  loginLink.textContent = 'Cerrar sesión';
  loginLink.href = '/logout';
}

document.addEventListener('click', (event) => {
  const target = event.target;
  const logoutLink = target instanceof Element && target.closest('a[href="/logout"]');

  if (logoutLink) {
    sessionStorage.removeItem('nutriplanToken');
  }
});
