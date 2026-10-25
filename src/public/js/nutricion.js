const token = sessionStorage.getItem('nutriplanToken');
const mealDate = document.getElementById('meal-date');
const summaryDate = document.getElementById('summary-date');
const mealStatus = document.getElementById('meal-status');
const summaryStatus = document.getElementById('summary-status');
const numberFormat = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 });

function todayAsISODate() {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

function showStatus(element, message, isError = false) {
  element.textContent = message;
  element.classList.toggle('text-danger', isError);
  element.classList.toggle('text-success', !isError && Boolean(message));
}

async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);

  if (options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(path, { ...options, headers });
  const result = await response.json();

  if (response.status === 401) {
    sessionStorage.removeItem('nutriplanToken');
    sessionStorage.removeItem('nutriplanUser');
    window.location.replace('/login');
    throw new Error('Tu sesión venció. Inicia sesión de nuevo.');
  }

  if (!response.ok) {
    throw new Error(result.message || 'No fue posible completar la solicitud.');
  }

  return result.data;
}

function addCell(row, value) {
  const cell = document.createElement('td');
  cell.textContent = value;
  row.append(cell);
  return cell;
}

async function loadFoods() {
  const select = document.getElementById('food-select');
  const foods = await apiRequest('/api/alimentos');

  select.replaceChildren(new Option('Selecciona un alimento', ''));
  foods.forEach((food) => select.add(new Option(food.nombre, String(food.id))));
}

function displayTotals(totals) {
  document.getElementById('total-calories').textContent = `${numberFormat.format(totals.calorias)} kcal`;
  document.getElementById('total-protein').textContent = `${numberFormat.format(totals.proteina)} g`;
  document.getElementById('total-carbs').textContent = `${numberFormat.format(totals.carbohidratos)} g`;
  document.getElementById('total-fat').textContent = `${numberFormat.format(totals.grasa)} g`;
}

function displayMeals(meals) {
  const mealsList = document.getElementById('meals-list');
  mealsList.replaceChildren();

  if (meals.length === 0) {
    const row = mealsList.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 8;
    cell.className = 'text-muted';
    cell.textContent = 'No hay comidas registradas para esta fecha.';
    return;
  }

  meals.forEach((meal) => {
    const row = mealsList.insertRow();
    addCell(row, meal.tipo);
    addCell(row, meal.alimento.nombre);
    addCell(row, `${numberFormat.format(meal.gramos)} g`);
    addCell(row, `${numberFormat.format(meal.nutrientes.calorias)} kcal`);
    addCell(row, `${numberFormat.format(meal.nutrientes.proteina)} g`);
    addCell(row, `${numberFormat.format(meal.nutrientes.carbohidratos)} g`);
    addCell(row, `${numberFormat.format(meal.nutrientes.grasa)} g`);

    const actionCell = row.insertCell();
    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'btn btn-sm btn-outline-danger';
    deleteButton.textContent = 'Eliminar';
    deleteButton.addEventListener('click', () => deleteMeal(meal.id));
    actionCell.append(deleteButton);
  });
}

async function loadSummary() {
  const date = summaryDate.value;

  if (!date) {
    return;
  }

  showStatus(summaryStatus, 'Cargando resumen...');

  try {
    const summary = await apiRequest(`/api/resumen?fecha=${encodeURIComponent(date)}`);
    displayTotals(summary.totales);
    displayMeals(summary.comidas);
    showStatus(summaryStatus, '');
  } catch (error) {
    showStatus(summaryStatus, error.message, true);
  }
}

async function deleteMeal(id) {
  if (!window.confirm('¿Quieres eliminar esta comida?')) {
    return;
  }

  try {
    await apiRequest(`/api/comidas/${id}`, { method: 'DELETE' });
    showStatus(mealStatus, 'Comida eliminada.');
    await loadSummary();
  } catch (error) {
    showStatus(mealStatus, error.message, true);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!token) {
    window.location.replace('/login');
    return;
  }

  const storedUser = sessionStorage.getItem('nutriplanUser');

  if (storedUser) {
    let user;

    try {
      user = JSON.parse(storedUser);
    } catch {
      sessionStorage.removeItem('nutriplanUser');
    }

    if (user?.nombre) {
      document.getElementById('welcome-message').textContent = `Hola, ${user.nombre}. Consulta tu día y registra tus comidas.`;
    }
  }

  const today = todayAsISODate();
  mealDate.value = today;
  summaryDate.value = today;

  mealDate.addEventListener('change', () => {
    summaryDate.value = mealDate.value;
    loadSummary();
  });
  summaryDate.addEventListener('change', () => {
    mealDate.value = summaryDate.value;
    loadSummary();
  });

  document.getElementById('meal-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    showStatus(mealStatus, 'Registrando comida...');

    try {
      await apiRequest('/api/comidas', {
        method: 'POST',
        body: JSON.stringify({
          alimento_id: Number(document.getElementById('food-select').value),
          gramos: Number(document.getElementById('meal-grams').value),
          fecha: mealDate.value,
          tipo: document.getElementById('meal-type').value,
        }),
      });
      document.getElementById('meal-grams').value = '';
      showStatus(mealStatus, 'Comida registrada.');
      await loadSummary();
    } catch (error) {
      showStatus(mealStatus, error.message, true);
    }
  });

  document.getElementById('logout-button').addEventListener('click', () => {
    sessionStorage.removeItem('nutriplanToken');
    sessionStorage.removeItem('nutriplanUser');
    window.location.replace('/login');
  });

  try {
    await loadFoods();
    await loadSummary();
  } catch (error) {
    showStatus(mealStatus, error.message, true);
  }
});
