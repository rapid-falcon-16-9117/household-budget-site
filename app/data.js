// Hearth demo data: the Alvarez household, November 2026.
// Every figure on the site is computed from these rows, so the dashboard,
// budgets, goals and bills always agree with each other.
//
// Household: Maya (designer) and Tom Alvarez, two incomes, one shared
// pot. Month income $5,200.00: salary $4,600 + freelance $600.

export const MONTH_LABEL = 'November 2026';
export const HOUSEHOLD = 'The Alvarez household';

// Money in, November 2026.
export const income = [
  { id: 'inc-1', date: '2026-11-01', source: 'Salary — Maya Alvarez', amount: 4600 },
  { id: 'inc-2', date: '2026-11-14', source: 'Freelance design — Maya', amount: 600 },
];

// What the household plans to put aside this month, on the 1st.
export const SAVINGS_TRANSFER = { date: '2026-11-01', label: 'Transfer to savings', amount: 600 };

// Monthly spending limits, one per category.
export const budgets = [
  { category: 'Housing', limit: 1500 },
  { category: 'Groceries', limit: 650 },
  { category: 'Transport', limit: 220 },
  { category: 'Utilities', limit: 300 },
  { category: 'Dining', limit: 300 },
  { category: 'Entertainment', limit: 180 },
  { category: 'Shopping', limit: 200 },
  { category: 'Health', limit: 150 },
];

// 28 expense transactions, November 2026. Total: $3,010.47.
export const transactions = [
  { id: 't01', date: '2026-11-01', description: 'Rent — Maple Court Apt 4B', category: 'Housing', amount: 1450.00 },
  { id: 't02', date: '2026-11-02', description: 'Whole Foods Market', category: 'Groceries', amount: 132.40 },
  { id: 't03', date: '2026-11-03', description: 'Metro monthly pass', category: 'Transport', amount: 98.00 },
  { id: 't04', date: '2026-11-04', description: 'Electric — City Power', category: 'Utilities', amount: 86.20 },
  { id: 't05', date: '2026-11-05', description: 'Blue Bottle Coffee', category: 'Dining', amount: 18.50 },
  { id: 't06', date: '2026-11-06', description: 'Netflix', category: 'Entertainment', amount: 15.49 },
  { id: 't07', date: '2026-11-07', description: "Trader Joe's", category: 'Groceries', amount: 87.65 },
  { id: 't08', date: '2026-11-08', description: 'Gas — Shell', category: 'Transport', amount: 42.30 },
  { id: 't09', date: '2026-11-09', description: 'Water bill — City Water', category: 'Utilities', amount: 54.10 },
  { id: 't10', date: '2026-11-10', description: 'Sushi dinner — Kaito', category: 'Dining', amount: 64.80 },
  { id: 't11', date: '2026-11-11', description: 'Pharmacy — CVS', category: 'Health', amount: 32.15 },
  { id: 't12', date: '2026-11-12', description: 'Amazon — household supplies', category: 'Shopping', amount: 58.99 },
  { id: 't13', date: '2026-11-13', description: 'Internet — Fiber 500', category: 'Utilities', amount: 79.00 },
  { id: 't14', date: '2026-11-14', description: 'Gym membership', category: 'Health', amount: 45.00 },
  { id: 't15', date: '2026-11-15', description: 'Farmers market', category: 'Groceries', amount: 46.20 },
  { id: 't16', date: '2026-11-16', description: 'Movie night — cinema', category: 'Entertainment', amount: 34.00 },
  { id: 't17', date: '2026-11-17', description: 'Bus fare top-up', category: 'Transport', amount: 25.00 },
  { id: 't18', date: '2026-11-18', description: 'Lunch with friends — Bistro Verde', category: 'Dining', amount: 42.60 },
  { id: 't19', date: '2026-11-19', description: 'Costco', category: 'Groceries', amount: 154.80 },
  { id: 't20', date: '2026-11-20', description: 'Spotify', category: 'Entertainment', amount: 11.99 },
  { id: 't21', date: '2026-11-21', description: 'Phone bill — T-Mobile', category: 'Utilities', amount: 65.00 },
  { id: 't22', date: '2026-11-22', description: 'Target — home goods', category: 'Shopping', amount: 73.45 },
  { id: 't23', date: '2026-11-23', description: 'Pizza night — delivery', category: 'Dining', amount: 28.90 },
  { id: 't24', date: '2026-11-24', description: 'Uber — airport run', category: 'Transport', amount: 19.75 },
  { id: 't25', date: '2026-11-25', description: 'Whole Foods Market', category: 'Groceries', amount: 96.30 },
  { id: 't26', date: '2026-11-26', description: 'Thanksgiving groceries', category: 'Groceries', amount: 88.40 },
  { id: 't27', date: '2026-11-27', description: 'Bookstore — Powell’s', category: 'Shopping', amount: 24.50 },
  { id: 't28', date: '2026-11-28', description: 'Haircut — Studio Nine', category: 'Health', amount: 35.00 },
];

// Savings goals. Total saved so far: $8,370 of $17,700.
export const goals = [
  { id: 'g1', name: 'Emergency fund', target: 6000, saved: 4200, note: 'Six months of rent, just in case.' },
  { id: 'g2', name: 'Japan trip — spring 2027', target: 2500, saved: 1180, note: 'Flights and two weeks in Kyoto.' },
  { id: 'g3', name: 'New sofa', target: 1200, saved: 640, note: 'The old one has earned its retirement.' },
  { id: 'g4', name: 'Car down payment', target: 8000, saved: 2350, note: 'Replacing the 2012 Civic next year.' },
];

// Recurring monthly bills. Paid $2,394.79 of $2,538.78; $143.99 still due.
export const bills = [
  { id: 'b01', name: 'Rent — Maple Court Apt 4B', category: 'Housing', amount: 1450.00, due: '2026-11-01', paid: true, autopay: true },
  { id: 'b02', name: 'Transfer to savings', category: 'Savings', amount: 600.00, due: '2026-11-01', paid: true, autopay: true },
  { id: 'b03', name: 'Internet — Fiber 500', category: 'Utilities', amount: 79.00, due: '2026-11-05', paid: true, autopay: true },
  { id: 'b04', name: 'Electric — City Power', category: 'Utilities', amount: 86.20, due: '2026-11-08', paid: true, autopay: false },
  { id: 'b05', name: 'Water — City Water', category: 'Utilities', amount: 54.10, due: '2026-11-12', paid: true, autopay: false },
  { id: 'b06', name: 'Phone — T-Mobile', category: 'Utilities', amount: 65.00, due: '2026-11-15', paid: true, autopay: true },
  { id: 'b07', name: 'Gym membership', category: 'Health', amount: 45.00, due: '2026-11-18', paid: true, autopay: true },
  { id: 'b08', name: 'Netflix', category: 'Entertainment', amount: 15.49, due: '2026-11-20', paid: true, autopay: true },
  { id: 'b09', name: 'Home insurance', category: 'Housing', amount: 132.00, due: '2026-11-25', paid: false, autopay: false },
  { id: 'b10', name: 'Spotify', category: 'Entertainment', amount: 11.99, due: '2026-11-28', paid: false, autopay: true },
];

// Past months, for the six-month trend (June–October 2026).
// November's bar is computed live from the transactions above.
export const history = [
  { month: 'Jun', income: 5200, spent: 2840 },
  { month: 'Jul', income: 5200, spent: 3120 },
  { month: 'Aug', income: 5350, spent: 2980 },
  { month: 'Sep', income: 5200, spent: 2760 },
  { month: 'Oct', income: 5200, spent: 3050 },
];

export const CATEGORIES = ['Housing', 'Groceries', 'Transport', 'Utilities', 'Dining', 'Entertainment', 'Shopping', 'Health'];

export const CATEGORY_COLORS = {
  Housing: '#2f4a75',
  Groceries: '#2f6b2a',
  Transport: '#2f5d8a',
  Utilities: '#b98a1d',
  Dining: '#c96f3f',
  Entertainment: '#6d3a80',
  Shopping: '#4d3a80',
  Health: '#1e5c46',
};
