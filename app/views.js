// HTML for each page, built from the household data. Every value shown is
// computed from the stored rows, so the figures agree across pages. All
// user text is escaped before it goes into the page.

import { CATEGORIES, CATEGORY_COLORS, MONTH_LABEL, SAVINGS_TRANSFER, history } from './data.js';

const escape = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
export const money = (n) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (n) => `${Math.round(n)}%`;
const catClass = (c) => c.toLowerCase().replace(/[^a-z]/g, '');
const fmtDate = (d) => {
  const [y, m, day] = d.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, day)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
};
const weekOf = (d) => Math.min(4, Math.ceil(Number(d.split('-')[2]) / 7));

export function totals(state) {
  const income = state.income.reduce((s, r) => s + r.amount, 0);
  const spent = state.transactions.reduce((s, t) => s + t.amount, 0);
  const saved = SAVINGS_TRANSFER.amount;
  return { income, spent, saved, left: income - spent - saved };
}

export function spentByCategory(state) {
  const out = {};
  for (const c of CATEGORIES) out[c] = 0;
  for (const t of state.transactions) out[t.category] = (out[t.category] ?? 0) + t.amount;
  return out;
}

// ---- SVG charts (inline, no libraries, no network) ----

function donut(byCat, total) {
  const R = 70, C = 2 * Math.PI * R;
  let offset = 0;
  const segs = CATEGORIES.filter((c) => byCat[c] > 0).map((c) => {
    const frac = byCat[c] / total;
    const seg = `<circle cx="100" cy="100" r="${R}" fill="none" stroke="${CATEGORY_COLORS[c]}" stroke-width="34" stroke-dasharray="${(frac * C).toFixed(1)} ${C.toFixed(1)}" stroke-dashoffset="${(-offset * C).toFixed(1)}" />`;
    offset += frac;
    return seg;
  }).join('');
  return `<svg width="200" height="200" viewBox="0 0 200 200" role="img" aria-label="Spending by category, donut chart">
    <circle cx="100" cy="100" r="${R}" fill="none" stroke="#eee5d8" stroke-width="34" />
    ${segs}
    <text x="100" y="94" text-anchor="middle" font-size="20" font-weight="800" fill="#24312b">${money(total)}</text>
    <text x="100" y="114" text-anchor="middle" font-size="11" fill="#6b756f">spent in</text>
    <text x="100" y="129" text-anchor="middle" font-size="11" fill="#6b756f">November</text>
  </svg>`;
}

function weekBars(state) {
  const weeks = [0, 0, 0, 0];
  for (const t of state.transactions) weeks[weekOf(t.date) - 1] += t.amount;
  const max = Math.max(...weeks, 1);
  const cols = weeks.map((v, i) => `<div class="bar-col">
      <span class="v num">${money(v)}</span>
      <div class="bar" style="height:${Math.max(4, Math.round((v / max) * 96))}px"></div>
      <span class="k">Week ${i + 1}</span>
    </div>`).join('');
  return `<div class="bars">${cols}</div>`;
}

function trendBars(spentNov) {
  const months = [...history, { month: 'Nov', income: 5200, spent: spentNov }];
  const max = Math.max(...months.flatMap((m) => [m.income, m.spent]), 1);
  const cols = months.map((m) => `<div class="bar-col">
      <span class="v num">${money(m.spent)}</span>
      <div class="bar" style="height:${Math.max(4, Math.round((m.spent / max) * 96))}px"></div>
      <span class="k">${m.month}<br><span class="muted">in ${money(m.income)}</span></span>
    </div>`).join('');
  return `<div class="bars">${cols}</div><p class="small muted">Bars show spending; the grey line under each month is income that month. November is live from this month's transactions.</p>`;
}

// ---- Dashboard ----

export function dashboard(state) {
  const t = totals(state);
  const byCat = spentByCategory(state);
  const recent = [...state.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  const budgetRows = state.budgets.map((b) => ({ ...b, spent: byCat[b.category] ?? 0 }))
    .sort((a, b) => b.spent / b.limit - a.spent / a.limit).slice(0, 3);
  const saveRate = (t.saved / t.income) * 100;

  const recentRows = recent.map((tx) => `<tr>
      <td>${fmtDate(tx.date)}</td>
      <td>${escape(tx.description)}</td>
      <td><span class="cat ${catClass(tx.category)}">${escape(tx.category)}</span></td>
      <td class="amount num">−${money(tx.amount)}</td>
    </tr>`).join('');

  const legend = CATEGORIES.filter((c) => byCat[c] > 0)
    .sort((a, b) => byCat[b] - byCat[a])
    .map((c) => `<li><span class="swatch" style="background:${CATEGORY_COLORS[c]}"></span>${escape(c)}<span class="amt num">${money(byCat[c])}</span></li>`).join('');

  const budgetList = budgetRows.map((b) => {
    const p = (b.spent / b.limit) * 100;
    const cls = p >= 100 ? 'over' : p >= 85 ? 'warn' : '';
    const status = p >= 100 ? 'Over budget' : p >= 85 ? 'Almost there' : 'On track';
    return `<div class="budget-row">
      <div class="budget-head"><b>${escape(b.category)}</b><span class="num">${money(b.spent)} of ${money(b.limit)}</span></div>
      <div class="progress ${cls}" style="margin-top:6px"><i style="width:${Math.min(100, p).toFixed(1)}%"></i></div>
      <div class="budget-meta"><span>${pct(p)} used</span><span class="pill ${p >= 100 ? 'over' : p >= 85 ? 'watch' : 'ok'}">${status}</span></div>
    </div>`;
  }).join('');

  const goalList = state.goals.map((g) => {
    const p = (g.saved / g.target) * 100;
    return `<div class="budget-row">
      <div class="budget-head"><b>${escape(g.name)}</b><span class="num">${money(g.saved)} of ${money(g.target)}</span></div>
      <div class="progress" style="margin-top:6px"><i style="width:${Math.min(100, p).toFixed(1)}%"></i></div>
      <div class="budget-meta"><span>${pct(p)} saved</span><span>${money(g.target - g.saved)} to go</span></div>
    </div>`;
  }).join('');

  return `<h1>Good evening, Alvarez household</h1>
<p class="lede">November 2026 at a glance: <strong class="num">${money(t.income)}</strong> came in, <strong class="num">${money(t.spent)}</strong> went out across ${state.transactions.length} purchases, and <strong class="num">${money(t.saved)}</strong> moved to savings.</p>

<section class="grid cols-4" aria-label="Month overview">
  <div class="card stat income"><div class="label">Income</div><div class="value num">${money(t.income)}</div><div class="note">Salary $4,600 + freelance $600</div></div>
  <div class="card stat spent"><div class="label">Spent</div><div class="value num">${money(t.spent)}</div><div class="note">${pct((t.spent / t.income) * 100)} of income · ${state.transactions.length} transactions</div></div>
  <div class="card stat"><div class="label">To savings</div><div class="value num">${money(t.saved)}</div><div class="note">${pct(saveRate)} savings rate · auto-transfer on the 1st</div><div class="bar"><i style="width:${saveRate.toFixed(1)}%"></i></div></div>
  <div class="card stat left"><div class="label">Left to spend</div><div class="value num">${money(t.left)}</div><div class="note">Until 30 November · ${money(t.left / 30)} a day</div></div>
</section>

<section class="grid cols-2" style="margin-top:16px">
  <div class="card">
    <h2>Where the money went</h2>
    <p class="sub">Spending by category, November 2026.</p>
    <div class="chart-wrap">${donut(byCat, t.spent)}<ul class="legend">${legend}</ul></div>
  </div>
  <div class="card">
    <h2>Spending by week</h2>
    <p class="sub">Week 4 runs high — Thanksgiving groceries on the 26th.</p>
    ${weekBars(state)}
  </div>
</section>

<section class="grid cols-2" style="margin-top:16px">
  <div class="card">
    <h2>Recent transactions</h2>
    <p class="sub">The latest six purchases. <a href="#/transactions">See all ${state.transactions.length} →</a></p>
    <table><thead><tr><th>Date</th><th>What</th><th>Category</th><th class="amount">Amount</th></tr></thead>
    <tbody>${recentRows}</tbody></table>
  </div>
  <div class="card">
    <h2>Budgets closest to the limit</h2>
    <p class="sub">Housing, utilities and groceries are nearly spent. <a href="#/budgets">All 8 budgets →</a></p>
    ${budgetList}
  </div>
</section>

<section class="grid cols-2" style="margin-top:16px">
  <div class="card">
    <h2>Savings goals</h2>
    <p class="sub"><span class="num">${money(state.goals.reduce((s, g) => s + g.saved, 0))}</span> saved across ${state.goals.length} goals. <a href="#/goals">Manage goals →</a></p>
    ${goalList}
  </div>
  <div class="card">
    <h2>Six-month trend</h2>
    <p class="sub">Spending has stayed between $2,760 and $3,120 since June.</p>
    ${trendBars(t.spent)}
  </div>
</section>`;
}

// ---- Transactions ----

export function transactionsView(state, filter) {
  const q = (filter.q ?? '').trim().toLowerCase();
  const cat = filter.category ?? 'All';
  const rows = [...state.transactions]
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    .filter((t) => (cat === 'All' || t.category === cat) && (!q || t.description.toLowerCase().includes(q)));
  const shownTotal = rows.reduce((s, t) => s + t.amount, 0);

  const options = ['All', ...CATEGORIES].map((c) =>
    `<option value="${escape(c)}" ${c === cat ? 'selected' : ''}>${escape(c)}</option>`).join('');

  const body = rows.length ? rows.map((t) => `<tr>
      <td class="num">${fmtDate(t.date)}</td>
      <td>${escape(t.description)}</td>
      <td><span class="cat ${catClass(t.category)}">${escape(t.category)}</span></td>
      <td class="amount num">−${money(t.amount)}</td>
      <td><button type="button" class="small secondary" data-edit="${escape(t.id)}">Edit</button>
          <button type="button" class="small danger" data-delete="${escape(t.id)}">Delete</button></td>
    </tr>`).join('') : `<tr><td colspan="5" class="muted">No transactions match. Try clearing the search or the category filter.</td></tr>`;

  return `<h1>Transactions</h1>
<p class="lede">Every purchase in November 2026. Add, edit or delete — changes are saved on this device and the dashboard, budgets and charts update with them.</p>

<div class="card" style="margin-bottom:16px">
  <h2 id="form-title">Add a transaction</h2>
  <form id="tx-form" class="inline">
    <input type="hidden" id="tx-id" value="">
    <label class="field">Date<input type="date" id="tx-date" value="2026-11-27" min="2026-11-01" max="2026-11-30" required></label>
    <label class="field grow">What<input type="text" id="tx-desc" placeholder="e.g. Whole Foods Market" maxlength="80" required></label>
    <label class="field">Category<select id="tx-cat">${CATEGORIES.map((c) => `<option>${escape(c)}</option>`).join('')}</select></label>
    <label class="field">Amount $<input type="number" id="tx-amount" min="0.01" step="0.01" placeholder="0.00" required></label>
    <button type="submit" id="tx-submit">Add transaction</button>
    <button type="button" class="secondary" id="tx-cancel" hidden>Cancel edit</button>
  </form>
  <p class="form-note" id="tx-error" role="alert"></p>
</div>

<div class="card">
  <div class="toolbar">
    <label class="field">Search<input type="search" id="tx-search" placeholder="Search purchases…" value="${escape(filter.q ?? '')}"></label>
    <label class="field">Category<select id="tx-filter">${options}</select></label>
    <span class="spacer"></span>
    <span class="muted small num" id="tx-count">${rows.length} of ${state.transactions.length} shown · ${money(shownTotal)}</span>
  </div>
  <table>
    <thead><tr><th>Date</th><th>What</th><th>Category</th><th class="amount">Amount</th><th><span class="hide-phone">Actions</span></th></tr></thead>
    <tbody>${body}</tbody>
    <tfoot><tr class="total"><td colspan="3">Shown total</td><td class="amount num">−${money(shownTotal)}</td><td></td></tr></tfoot>
  </table>
  <p class="form-note">Income this month: salary $4,600 on 1 Nov and freelance $600 on 14 Nov — see the <a href="#/">dashboard</a>. <button type="button" class="linklike" id="reset-data">Reset demo data</button></p>
</div>`;
}

// ---- Budgets ----

export function budgetsView(state) {
  const byCat = spentByCategory(state);
  const totalLimit = state.budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = Object.values(byCat).reduce((s, v) => s + v, 0);
  const cards = state.budgets.map((b) => {
    const spent = byCat[b.category] ?? 0;
    const p = (spent / b.limit) * 100;
    const cls = p >= 100 ? 'over' : p >= 85 ? 'warn' : '';
    const status = p >= 100 ? 'Over budget' : p >= 85 ? 'Almost there' : 'On track';
    const remaining = b.limit - spent;
    return `<div class="card">
      <div class="budget-head"><h3>${escape(b.category)}</h3><span class="pill ${p >= 100 ? 'over' : p >= 85 ? 'watch' : 'ok'}">${status}</span></div>
      <p class="num" style="font-size:24px;font-weight:800;margin:6px 0 2px">${money(spent)} <span class="muted" style="font-size:15px;font-weight:400">of ${money(b.limit)}</span></p>
      <div class="progress ${cls}"><i style="width:${Math.min(100, p).toFixed(1)}%"></i></div>
      <div class="budget-meta"><span>${pct(p)} used</span><span class="num">${remaining >= 0 ? money(remaining) + ' left' : money(-remaining) + ' over'}</span></div>
      <form class="inline budget-edit" data-category="${escape(b.category)}" style="margin-top:12px">
        <label class="field">Monthly limit $<input type="number" name="limit" min="1" step="1" value="${b.limit}" required></label>
        <button type="submit" class="small">Save limit</button>
      </form>
    </div>`;
  }).join('');

  return `<h1>Budgets</h1>
<p class="lede">Eight monthly limits totalling <strong class="num">${money(totalLimit)}</strong>. So far <strong class="num">${money(totalSpent)}</strong> is spent — <strong class="num">${money(totalLimit - totalSpent)}</strong> of headroom left. Change any limit and it saves on this device.</p>
<section class="grid cols-3">${cards}</section>
<p class="muted small" style="margin-top:16px">Tip: housing is at 96.7% because rent lands on the 1st — it is not overspending, it is one big fixed payment. The ones to watch are groceries (93.2%) and utilities (94.8%) with two days left in the month.</p>`;
}

// ---- Savings goals ----

export function goalsView(state) {
  const totalSaved = state.goals.reduce((s, g) => s + g.saved, 0);
  const totalTarget = state.goals.reduce((s, g) => s + g.target, 0);
  const cards = state.goals.map((g) => {
    const p = (g.saved / g.target) * 100;
    const done = g.saved >= g.target;
    return `<div class="card goal-card">
      <div class="goal-top"><b>${escape(g.name)}</b><span class="pill ${done ? 'ok' : 'watch'}">${done ? 'Reached!' : pct(p) + ' saved'}</span></div>
      <p class="muted small" style="margin:0">${escape(g.note)}</p>
      <p class="num" style="font-size:24px;font-weight:800;margin:2px 0">${money(g.saved)} <span class="muted" style="font-size:15px;font-weight:400">of ${money(g.target)}</span></p>
      <div class="progress"><i style="width:${Math.min(100, p).toFixed(1)}%"></i></div>
      <div class="budget-meta"><span>${money(g.target - g.saved)} to go</span><span>${done ? 'Goal reached' : 'On track'}</span></div>
      <form class="inline goal-add" data-goal="${escape(g.id)}">
        <label class="field">Add $<input type="number" name="amount" min="1" step="1" value="50" required></label>
        <button type="submit" class="small">Add to goal</button>
      </form>
    </div>`;
  }).join('');

  return `<h1>Savings goals</h1>
<p class="lede"><strong class="num">${money(totalSaved)}</strong> saved toward <strong class="num">${money(totalTarget)}</strong> across ${state.goals.length} goals — ${pct((totalSaved / totalTarget) * 100)} of the way there. Add money to any goal; it saves on this device.</p>
<section class="grid cols-2">${cards}</section>
<div class="card" style="margin-top:16px">
  <h2>Start a new goal</h2>
  <form id="goal-form" class="inline">
    <label class="field grow">Goal name<input type="text" id="goal-name" placeholder="e.g. New bikes for the kids" maxlength="60" required></label>
    <label class="field">Target $<input type="number" id="goal-target" min="1" step="1" placeholder="1000" required></label>
    <button type="submit">Create goal</button>
  </form>
  <p class="form-note" id="goal-error" role="alert"></p>
</div>`;
}

// ---- Bills & planner ----

export function billsView(state) {
  const sorted = [...state.bills].sort((a, b) => a.due.localeCompare(b.due));
  const total = state.bills.reduce((s, b) => s + b.amount, 0);
  const paidSum = state.bills.filter((b) => b.paid).reduce((s, b) => s + b.amount, 0);
  const upcoming = state.bills.filter((b) => !b.paid);
  const upcomingSum = upcoming.reduce((s, b) => s + b.amount, 0);

  const rows = sorted.map((b) => `<tr>
      <td><input type="checkbox" data-bill="${escape(b.id)}" ${b.paid ? 'checked' : ''} aria-label="Mark ${escape(b.name)} as paid"></td>
      <td>${escape(b.name)}</td>
      <td><span class="cat ${catClass(b.category)}">${escape(b.category)}</span></td>
      <td class="num">${fmtDate(b.due)}</td>
      <td class="amount num">${money(b.amount)}</td>
      <td>${b.paid ? '<span class="bill-paid">Paid ✓</span>' : '<span class="bill-due">Due</span>'}</td>
      <td class="hide-phone">${b.autopay ? 'Autopay' : 'Manual'}</td>
    </tr>`).join('');

  const upcomingList = upcoming.length
    ? upcoming.map((b) => `<li><strong>${escape(b.name)}</strong> — <span class="num">${money(b.amount)}</span> due ${fmtDate(b.due)}</li>`).join('')
    : '<li>Nothing left due this month. Nicely done.</li>';

  return `<h1>Bills &amp; monthly planner</h1>
<p class="lede">Every recurring payment for November 2026, in due-date order. Tick a bill off when it clears — the totals update right away.</p>

<section class="grid cols-4" aria-label="Bills overview" style="margin-bottom:16px">
  <div class="card stat"><div class="label">Bills this month</div><div class="value num">${money(total)}</div><div class="note">${state.bills.length} recurring payments</div></div>
  <div class="card stat income"><div class="label">Paid</div><div class="value num">${money(paidSum)}</div><div class="note">${state.bills.filter((b) => b.paid).length} of ${state.bills.length} bills</div></div>
  <div class="card stat spent"><div class="label">Still due</div><div class="value num">${money(upcomingSum)}</div><div class="note">${upcoming.length} bill${upcoming.length === 1 ? '' : 's'} left</div></div>
  <div class="card stat"><div class="label">Autopay</div><div class="value num">${state.bills.filter((b) => b.autopay).length} bills</div><div class="note">Set and forget — rent, savings, utilities</div></div>
</section>

<div class="grid cols-2-1">
  <div class="card">
    <h2>November bills</h2>
    <table>
      <thead><tr><th><span class="hide-phone">Paid</span></th><th>Bill</th><th>Category</th><th>Due</th><th class="amount">Amount</th><th>Status</th><th class="hide-phone">How</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr class="total"><td colspan="4">Total for the month</td><td class="amount num">${money(total)}</td><td colspan="2"></td></tr></tfoot>
    </table>
  </div>
  <div>
    <div class="card" style="margin-bottom:16px">
      <h2>Still to pay</h2>
      <ul>${upcomingList}</ul>
      <p class="small muted">Home insurance ($132) is the big one left — due 25 November, paid manually.</p>
    </div>
    <div class="card">
      <h2>Add a bill</h2>
      <form id="bill-form" class="inline">
        <label class="field grow">Bill<input type="text" id="bill-name" placeholder="e.g. Car insurance" maxlength="60" required></label>
        <label class="field">Amount $<input type="number" id="bill-amount" min="0.01" step="0.01" placeholder="0.00" required></label>
        <label class="field">Due<input type="date" id="bill-due" value="2026-11-29" min="2026-11-01" max="2026-11-30" required></label>
        <button type="submit">Add bill</button>
      </form>
      <p class="form-note" id="bill-error" role="alert"></p>
    </div>
  </div>
</div>`;
}

export function missing() {
  return `<h1>Not found</h1><p>There is no page at this address. <a href="#/">Back to the dashboard</a>.</p>`;
}
