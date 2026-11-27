// Hearth — Household Budget. Hash routes, localStorage persistence, and
// the wiring that makes every control on every page do what it says.
//
//   #/                dashboard
//   #/transactions    transactions, with add / edit / delete
//   #/budgets         monthly limits per category
//   #/goals           savings goals, with add-to-goal
//   #/bills           recurring bills planner, with paid toggles
//
// window.__shotReady is false while a page renders and true once it is on
// screen, so a screenshot script knows when to capture.

import { budgets as seedBudgets, bills as seedBills, goals as seedGoals, income as seedIncome, transactions as seedTransactions } from './data.js';
import { budgetsView, billsView, dashboard, goalsView, missing, transactionsView } from './views.js';

const STORE_KEY = 'hearth-budget-v1';
const app = document.getElementById('app');

function seed() {
  return {
    income: structuredClone(seedIncome),
    transactions: structuredClone(seedTransactions),
    budgets: structuredClone(seedBudgets),
    goals: structuredClone(seedGoals),
    bills: structuredClone(seedBills),
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return seed();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.transactions) || !Array.isArray(parsed.budgets)) return seed();
    return { ...seed(), ...parsed };
  } catch {
    return seed();
  }
}

function save(state) {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

let state = load();

// Search / filter state for the transactions page (kept across re-renders).
let txFilter = { q: '', category: 'All' };

function setActiveNav(route) {
  for (const a of document.querySelectorAll('[data-nav]')) {
    a.classList.toggle('active', a.dataset.nav === route);
  }
}

function render() {
  window.__shotReady = false;
  const hash = location.hash || '#/';
  const route = hash.replace(/^#\//, '').split('/')[0] || 'dashboard';
  if (route === 'dashboard') {
    document.title = 'Hearth — Household Budget';
    app.innerHTML = dashboard(state);
    setActiveNav('dashboard');
  } else if (route === 'transactions') {
    document.title = 'Transactions | Hearth';
    app.innerHTML = transactionsView(state, txFilter);
    setActiveNav('transactions');
    wireTransactions();
  } else if (route === 'budgets') {
    document.title = 'Budgets | Hearth';
    app.innerHTML = budgetsView(state);
    setActiveNav('budgets');
    wireBudgets();
  } else if (route === 'goals') {
    document.title = 'Savings goals | Hearth';
    app.innerHTML = goalsView(state);
    setActiveNav('goals');
    wireGoals();
  } else if (route === 'bills') {
    document.title = 'Bills & planner | Hearth';
    app.innerHTML = billsView(state);
    setActiveNav('bills');
    wireBills();
  } else {
    document.title = 'Not found | Hearth';
    app.innerHTML = missing();
    setActiveNav('');
  }
  window.scrollTo(0, 0);
  window.__shotReady = true;
}

function wireTransactions() {
  const form = document.getElementById('tx-form');
  const err = document.getElementById('tx-error');
  const idField = document.getElementById('tx-id');
  const dateField = document.getElementById('tx-date');
  const descField = document.getElementById('tx-desc');
  const catField = document.getElementById('tx-cat');
  const amountField = document.getElementById('tx-amount');
  const title = document.getElementById('form-title');
  const submitBtn = document.getElementById('tx-submit');
  const cancelBtn = document.getElementById('tx-cancel');

  const search = document.getElementById('tx-search');
  const filter = document.getElementById('tx-filter');
  search.addEventListener('input', () => { txFilter.q = search.value; render(); document.getElementById('tx-search').focus(); const v = txFilter.q; const el = document.getElementById('tx-search'); el.setSelectionRange(v.length, v.length); });
  filter.addEventListener('change', () => { txFilter.category = filter.value; render(); });

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const amount = Number(amountField.value);
    const desc = descField.value.trim();
    if (!desc || !Number.isFinite(amount) || amount <= 0) {
      err.textContent = 'Please enter a description and an amount over $0.00.';
      return;
    }
    if (idField.value) {
      const row = state.transactions.find((t) => t.id === idField.value);
      if (row) { row.date = dateField.value; row.description = desc; row.category = catField.value; row.amount = Math.round(amount * 100) / 100; }
    } else {
      state.transactions.push({
        id: 't' + Date.now().toString(36),
        date: dateField.value,
        description: desc,
        category: catField.value,
        amount: Math.round(amount * 100) / 100,
      });
    }
    save(state);
    render();
  });

  cancelBtn.addEventListener('click', () => render());

  for (const btn of app.querySelectorAll('[data-edit]')) {
    btn.addEventListener('click', () => {
      const row = state.transactions.find((t) => t.id === btn.dataset.edit);
      if (!row) return;
      idField.value = row.id;
      dateField.value = row.date;
      descField.value = row.description;
      catField.value = row.category;
      amountField.value = row.amount.toFixed(2);
      title.textContent = `Edit: ${row.description}`;
      submitBtn.textContent = 'Save changes';
      cancelBtn.hidden = false;
      form.scrollIntoView({ behavior: 'smooth', block: 'center' });
      descField.focus();
    });
  }

  for (const btn of app.querySelectorAll('[data-delete]')) {
    btn.addEventListener('click', () => {
      const row = state.transactions.find((t) => t.id === btn.dataset.delete);
      if (!row) return;
      if (window.confirm(`Delete “${row.description}” ($${row.amount.toFixed(2)})?`)) {
        state.transactions = state.transactions.filter((t) => t.id !== row.id);
        save(state);
        render();
      }
    });
  }

  const reset = document.getElementById('reset-data');
  if (reset) reset.addEventListener('click', () => {
    if (window.confirm('Reset all demo data to the original November figures?')) {
      localStorage.removeItem(STORE_KEY);
      state = seed();
      txFilter = { q: '', category: 'All' };
      render();
    }
  });
}

function wireBudgets() {
  for (const form of app.querySelectorAll('.budget-edit')) {
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const limit = Number(form.limit.value);
      if (!Number.isFinite(limit) || limit < 1) return;
      const row = state.budgets.find((b) => b.category === form.dataset.category);
      if (row) { row.limit = Math.round(limit); save(state); render(); }
    });
  }
}

function wireGoals() {
  for (const form of app.querySelectorAll('.goal-add')) {
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const amount = Number(form.amount.value);
      if (!Number.isFinite(amount) || amount <= 0) return;
      const goal = state.goals.find((g) => g.id === form.dataset.goal);
      if (goal) { goal.saved = Math.round((goal.saved + amount) * 100) / 100; save(state); render(); }
    });
  }
  const form = document.getElementById('goal-form');
  const err = document.getElementById('goal-error');
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const name = document.getElementById('goal-name').value.trim();
    const target = Number(document.getElementById('goal-target').value);
    if (!name || !Number.isFinite(target) || target < 1) {
      err.textContent = 'Please enter a goal name and a target over $0.';
      return;
    }
    state.goals.push({ id: 'g' + Date.now().toString(36), name, target: Math.round(target), saved: 0, note: 'Started November 2026.' });
    save(state);
    render();
  });
}

function wireBills() {
  for (const box of app.querySelectorAll('[data-bill]')) {
    box.addEventListener('change', () => {
      const bill = state.bills.find((b) => b.id === box.dataset.bill);
      if (bill) { bill.paid = box.checked; save(state); render(); }
    });
  }
  const form = document.getElementById('bill-form');
  const err = document.getElementById('bill-error');
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const name = document.getElementById('bill-name').value.trim();
    const amount = Number(document.getElementById('bill-amount').value);
    const due = document.getElementById('bill-due').value;
    if (!name || !Number.isFinite(amount) || amount <= 0 || !due) {
      err.textContent = 'Please enter a bill name, an amount over $0.00 and a due date.';
      return;
    }
    state.bills.push({ id: 'b' + Date.now().toString(36), name, category: 'Utilities', amount: Math.round(amount * 100) / 100, due, paid: false, autopay: false });
    save(state);
    render();
  });
}

// Footer reset button (present on every page).
document.getElementById('reset-demo').addEventListener('click', () => {
  if (window.confirm('Reset all demo data to the original November figures?')) {
    localStorage.removeItem(STORE_KEY);
    state = seed();
    txFilter = { q: '', category: 'All' };
    render();
  }
});

window.addEventListener('hashchange', render);
render();
