const form = document.querySelector('[data-auth-form]');
const message = document.querySelector('[data-auth-message]');

if (form && message) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    message.textContent = '';
    message.classList.remove('text-danger', 'text-success');

    const formData = new FormData(form);
    const isRegistration = form.dataset.authForm === 'register';
    const body = isRegistration
      ? {
        nombre: String(formData.get('nombre') ?? '').trim(),
        email: String(formData.get('email') ?? '').trim(),
        password: formData.get('password'),
      }
      : {
        email: String(formData.get('email') ?? '').trim(),
        password: formData.get('password'),
      };

    let response;
    try {
      response = await fetch(`/api/auth/${isRegistration ? 'register' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch {
      message.textContent = 'No fue posible conectar con el servidor. Inténtalo de nuevo.';
      message.classList.add('text-danger');
      return;
    }

    const result = await response.json();

    if (!response.ok) {
      message.textContent = result.message || 'No fue posible completar la solicitud.';
      message.classList.add('text-danger');
      return;
    }

    sessionStorage.setItem('nutriplanToken', result.data.token);
    const loginLink = document.querySelector('[data-login-link]');

    if (loginLink) {
      loginLink.textContent = 'Cerrar sesión';
      loginLink.href = '/logout';
    }

    message.textContent = result.message;
    message.classList.add('text-success');
    form.reset();
  });
}
