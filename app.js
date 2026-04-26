/**
 * SpendWise - Expense Dashboard
 * JavaScript Application Logic
 */

// --- STATE MANAGEMENT ---
let currentMonth = '2026-04';
let expenses = [];
let budgets = {};
let globalBudgetOverride = null;

// Categories and colors
const CATEGORIES = {
  'Housing': 'var(--cat-housing)',
  'Food': 'var(--cat-food)',
  'Transport': 'var(--cat-transport)',
  'Utilities': 'var(--cat-utilities)',
  'Healthcare': 'var(--cat-healthcare)',
  'Entertainment': 'var(--cat-entertainment)',
  'Shopping': 'var(--cat-shopping)',
  'Education': 'var(--cat-education)',
  'Savings': 'var(--cat-savings)',
  'Other': 'var(--cat-other)'
};

// Initial Mock Data
const MOCK_DATA = [
  { id: 1, desc: 'Rent', amount: 35000, category: 'Housing', date: '2026-04-01', notes: 'Monthly rent' },
  { id: 2, desc: 'Groceries', amount: 8500, category: 'Food', date: '2026-04-05', notes: 'Weekly shopping' },
  { id: 3, desc: 'Petrol', amount: 3000, category: 'Transport', date: '2026-04-08', notes: '' },
  { id: 4, desc: 'Electricity Bill', amount: 2400, category: 'Utilities', date: '2026-04-10', notes: 'March usage' },
  { id: 5, desc: 'Movie Tickets', amount: 900, category: 'Entertainment', date: '2026-04-12', notes: 'Weekend movie' },
  { id: 6, desc: 'Dinner Out', amount: 3500, category: 'Food', date: '2026-04-15', notes: 'Anniversary dinner' },
  { id: 7, desc: 'Pharmacy', amount: 1200, category: 'Healthcare', date: '2026-04-18', notes: 'Medications' },
  { id: 8, desc: 'New Shoes', amount: 4500, category: 'Shopping', date: '2026-04-20', notes: 'Running shoes' }
];

const DEFAULT_BUDGETS = {
  'Housing': 40000,
  'Food': 15000,
  'Transport': 5000,
  'Utilities': 4000,
  'Healthcare': 3000,
  'Entertainment': 5000,
  'Shopping': 8000,
  'Education': 4000,
  'Savings': 10000,
  'Other': 2000
};

// --- DOM ELEMENTS ---
const els = {
  // Navigation
  navItems: document.querySelectorAll('.nav-item'),
  pages: document.querySelectorAll('.page'),
  sidebarToggle: document.getElementById('sidebar-toggle'),
  sidebar: document.getElementById('sidebar'),
  pageTitle: document.getElementById('page-title'),
  
  // Dashboard Summary
  totalSpent: document.getElementById('total-spent'),
  spentVsBudget: document.getElementById('spent-vs-budget'),
  totalBudgetDisplay: document.getElementById('total-budget-display'),
  remainingBudget: document.getElementById('remaining-budget'),
  overBudgetCount: document.getElementById('over-budget-count'),
  transactionCount: document.getElementById('transaction-count'),
  
  // Tables & Grids
  recentTbody: document.getElementById('recent-tbody'),
  allExpenseTbody: document.getElementById('all-expense-tbody'),
  budgetGrid: document.getElementById('budget-grid'),
  budgetsPageGrid: document.getElementById('budgets-page-grid'),
  
  // Modals
  expenseModal: document.getElementById('expense-modal'),
  budgetModal: document.getElementById('budget-modal'),
  expenseForm: document.getElementById('expense-form'),
  
  // Inputs
  monthPicker: document.getElementById('month-picker'),
  expenseSearch: document.getElementById('expense-search'),
  expenseFilterCat: document.getElementById('expense-filter-cat'),
  expenseSort: document.getElementById('expense-sort'),
  
  // Charts
  pieChart: document.getElementById('pieChart'),
  pieLegend: document.getElementById('pie-legend'),
  pieTotalLabel: document.getElementById('pie-total-label'),
  barChart: document.getElementById('barChart'),
  reportBarChart: document.getElementById('reportBarChart'),
  reportCompareChart: document.getElementById('reportCompareChart'),
  reportLineChart: document.getElementById('reportLineChart'),
  
  // Toast
  toast: document.getElementById('toast')
};

// Chart Instances
let charts = {
  pie: null,
  bar: null,
  reportBar: null,
  reportCompare: null,
  reportLine: null
};

// --- INITIALIZATION ---
function init() {
  // Load data from localStorage or use mock
  const savedExpenses = localStorage.getItem('spendwise_expenses');
  const savedBudgets = localStorage.getItem('spendwise_budgets');
  
  if (savedExpenses) {
    expenses = JSON.parse(savedExpenses);
  } else {
    expenses = [...MOCK_DATA];
    saveData();
  }
  
  if (savedBudgets) {
    budgets = JSON.parse(savedBudgets);
  } else {
    budgets = {...DEFAULT_BUDGETS};
    saveBudgets();
  }
  
  const savedGlobalBudget = localStorage.getItem('spendwise_global_budget');
  if (savedGlobalBudget) globalBudgetOverride = parseFloat(savedGlobalBudget);
  
  setupEventListeners();
  populateCategoryFilters();
  updateUI();
}

// --- DATA HELPERS ---
function getExpensesForMonth(monthStr) {
  return expenses.filter(exp => exp.date.startsWith(monthStr));
}

function getCategoryTotals(expenseList) {
  const totals = {};
  Object.keys(CATEGORIES).forEach(cat => totals[cat] = 0);
  
  expenseList.forEach(exp => {
    if (totals[exp.category] !== undefined) {
      totals[exp.category] += parseFloat(exp.amount);
    } else {
      totals[exp.category] = parseFloat(exp.amount);
    }
  });
  return totals;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr) {
  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  return new Date(dateStr).toLocaleDateString('en-US', options);
}

function generateId() {
  return Math.floor(Math.random() * 1000000);
}

function saveData() {
  localStorage.setItem('spendwise_expenses', JSON.stringify(expenses));
}

function saveBudgets() {
  localStorage.setItem('spendwise_budgets', JSON.stringify(budgets));
}

// --- UI UPDATES ---
function updateUI() {
  const monthlyExpenses = getExpensesForMonth(currentMonth);
  const catTotals = getCategoryTotals(monthlyExpenses);
  
  let totalSpent = 0;
  let totalBudget = 0;
  let overCount = 0;
  
  // Calculate totals
  Object.keys(CATEGORIES).forEach(cat => {
    totalSpent += catTotals[cat];
    totalBudget += (budgets[cat] || 0);
    if (catTotals[cat] > (budgets[cat] || 0) && (budgets[cat] || 0) > 0) {
      overCount++;
    }
  });

  if (globalBudgetOverride !== null) {
    totalBudget = globalBudgetOverride;
  }
  
  // Update Summary Cards
  els.totalSpent.textContent = formatCurrency(totalSpent);
  els.totalBudgetDisplay.textContent = formatCurrency(totalBudget);
  els.transactionCount.textContent = monthlyExpenses.length;
  els.overBudgetCount.textContent = overCount;
  
  const remaining = totalBudget - totalSpent;
  els.remainingBudget.textContent = `${formatCurrency(Math.max(0, remaining))} remaining`;
  els.spentVsBudget.textContent = `of ${formatCurrency(totalBudget)} budget`;
  
  if (remaining < 0) {
    els.remainingBudget.style.color = 'var(--red)';
    els.remainingBudget.textContent = `${formatCurrency(Math.abs(remaining))} over budget!`;
  } else {
    els.remainingBudget.style.color = 'var(--text2)';
  }

  // Render Components
  renderRecentTransactions(monthlyExpenses);
  renderBudgetGrid(catTotals);
  renderExpensesTable(); // The all expenses page
  renderBudgetsPage();
  
  // Update Charts
  updatePieChart(catTotals, totalSpent);
  updateBarChart();
  updateReportCharts();
}

// --- RENDER FUNCTIONS ---
function renderRecentTransactions(monthlyExpenses) {
  els.recentTbody.innerHTML = '';
  
  const recent = [...monthlyExpenses].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  
  if (recent.length === 0) {
    els.recentTbody.innerHTML = `<tr class="empty-row"><td colspan="5">No expenses this month. Add one!</td></tr>`;
    return;
  }
  
  recent.forEach(exp => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${exp.desc}</strong></td>
      <td><span class="cat-pill" style="color: ${CATEGORIES[exp.category]}; background: ${CATEGORIES[exp.category]}20">${getCatIcon(exp.category)} ${exp.category}</span></td>
      <td>${formatDate(exp.date)}</td>
      <td style="font-weight:600;">${formatCurrency(exp.amount)}</td>
      <td>
        <button class="action-btn" onclick="editExpense(${exp.id})" title="Edit">✏️</button>
        <button class="action-btn delete" onclick="deleteExpense(${exp.id})" title="Delete">🗑️</button>
      </td>
    `;
    els.recentTbody.appendChild(tr);
  });
}

function renderBudgetGrid(catTotals) {
  els.budgetGrid.innerHTML = '';
  
  // Only show categories that have a budget > 0 or have spending
  const activeCats = Object.keys(CATEGORIES).filter(cat => (budgets[cat] > 0) || (catTotals[cat] > 0));
  
  if(activeCats.length === 0) {
    els.budgetGrid.innerHTML = `<div style="grid-column: 1/-1; color: var(--text3); padding: 20px;">No active budgets. Click 'Manage Budgets' to set them up.</div>`;
    return;
  }

  activeCats.forEach(cat => {
    const spent = catTotals[cat];
    const limit = budgets[cat] || 0;
    const pct = limit > 0 ? (spent / limit) * 100 : (spent > 0 ? 100 : 0);
    const isOver = spent > limit && limit > 0;
    
    const color = CATEGORIES[cat];
    const fillStyle = isOver ? 'var(--red)' : color;
    
    const div = document.createElement('div');
    div.className = `budget-item ${isOver ? 'over-budget' : ''}`;
    div.innerHTML = `
      <div class="budget-item-header">
        <div class="budget-cat-label">
          <div class="budget-cat-dot" style="background: ${color}"></div>
          ${cat}
        </div>
        <div class="budget-amounts">
          <span>${formatCurrency(spent)}</span> / ${limit > 0 ? formatCurrency(limit) : 'No limit'}
        </div>
      </div>
      <div class="budget-bar-wrap">
        <div class="budget-bar-fill" style="width: ${Math.min(pct, 100)}%; background: ${fillStyle}"></div>
      </div>
      <div class="budget-percent-row">
        <span>${pct.toFixed(0)}%</span>
        ${isOver ? `<span class="over-badge">Over by ${formatCurrency(spent - limit)}</span>` : `<span>${formatCurrency(Math.max(0, limit - spent))} left</span>`}
      </div>
    `;
    els.budgetGrid.appendChild(div);
  });
}

function renderExpensesTable() {
  const searchTerm = els.expenseSearch.value.toLowerCase();
  const filterCat = els.expenseFilterCat.value;
  const sortVal = els.expenseSort.value;
  
  let filtered = [...expenses];
  
  // Filter by search
  if (searchTerm) {
    filtered = filtered.filter(exp => exp.desc.toLowerCase().includes(searchTerm) || (exp.notes && exp.notes.toLowerCase().includes(searchTerm)));
  }
  
  // Filter by category
  if (filterCat !== 'all') {
    filtered = filtered.filter(exp => exp.category === filterCat);
  }
  
  // Sort
  filtered.sort((a, b) => {
    if (sortVal === 'date-desc') return new Date(b.date) - new Date(a.date);
    if (sortVal === 'date-asc') return new Date(a.date) - new Date(b.date);
    if (sortVal === 'amount-desc') return b.amount - a.amount;
    if (sortVal === 'amount-asc') return a.amount - b.amount;
    return 0;
  });
  
  els.allExpenseTbody.innerHTML = '';
  
  if (filtered.length === 0) {
    els.allExpenseTbody.innerHTML = `<tr class="empty-row"><td colspan="6">No expenses match your criteria.</td></tr>`;
    return;
  }
  
  filtered.forEach(exp => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${exp.desc}</strong></td>
      <td><span class="cat-pill" style="color: ${CATEGORIES[exp.category]}; background: ${CATEGORIES[exp.category]}20">${getCatIcon(exp.category)} ${exp.category}</span></td>
      <td>${formatDate(exp.date)}</td>
      <td style="font-weight:600;">${formatCurrency(exp.amount)}</td>
      <td style="color: var(--text2); font-size: 0.8rem;">${exp.notes || '-'}</td>
      <td>
        <button class="action-btn" onclick="editExpense(${exp.id})" title="Edit">✏️</button>
        <button class="action-btn delete" onclick="deleteExpense(${exp.id})" title="Delete">🗑️</button>
      </td>
    `;
    els.allExpenseTbody.appendChild(tr);
  });
}

function renderBudgetsPage() {
  els.budgetsPageGrid.innerHTML = '';
  
  Object.keys(CATEGORIES).forEach(cat => {
    const limit = budgets[cat] || 0;
    const color = CATEGORIES[cat];
    const icon = getCatIcon(cat);
    
    // Quick calc for current month spending for this category
    const monthlyExpenses = getExpensesForMonth(currentMonth);
    const spent = monthlyExpenses.filter(e => e.category === cat).reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const pct = limit > 0 ? Math.min((spent/limit)*100, 100) : 0;
    
    const div = document.createElement('div');
    div.className = 'budget-edit-card';
    div.innerHTML = `
      <div class="budget-edit-header">
        <span class="budget-edit-icon">${icon}</span>
        <span class="budget-edit-title" style="color: ${color}">${cat}</span>
      </div>
      <div class="budget-input-wrap">
        <label class="budget-input-label">Monthly Limit (₹)</label>
        <input type="number" class="budget-input direct-budget-input" data-cat="${cat}" value="${limit}" min="0" step="100">
      </div>
      <div class="budget-mini-bar">
        <div class="budget-mini-fill" style="width: ${pct}%; background: ${spent > limit && limit > 0 ? 'var(--red)' : color}"></div>
      </div>
      <div class="budget-edit-stats">
        <div>Spent: <span>${formatCurrency(spent)}</span></div>
        <div>Current Limit: <span>${formatCurrency(limit)}</span></div>
      </div>
    `;
    els.budgetsPageGrid.appendChild(div);
  });
  
  // Add listeners to direct inputs
  document.querySelectorAll('.direct-budget-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const cat = e.target.dataset.cat;
      const val = parseFloat(e.target.value) || 0;
      budgets[cat] = val;
      saveBudgets();
      updateUI();
      showToast(`Budget for ${cat} updated`, 'success');
    });
  });
}

// --- CHARTS ---
// Global Chart Defaults
Chart.defaults.color = '#9aa0bc';
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.borderColor = '#2a3050';

function updatePieChart(catTotals, totalSpent) {
  els.pieTotalLabel.textContent = formatCurrency(totalSpent);
  
  const labels = [];
  const data = [];
  const bgColors = [];
  
  Object.keys(catTotals).forEach(cat => {
    if (catTotals[cat] > 0) {
      labels.push(cat);
      data.push(catTotals[cat]);
      // Extract color value from css var string 'var(--cat-housing)' -> need actual hex or let browser handle if ChartJS supports it?
      // ChartJS supports css variables if computed, but passing the string usually works in modern browsers, or we can use a small hack
      bgColors.push(getComputedStyle(document.documentElement).getPropertyValue(`--cat-${cat.toLowerCase()}`).trim() || '#fff');
    }
  });
  
  if (data.length === 0) {
    labels.push('No Data');
    data.push(1);
    bgColors.push('#2a3050');
  }

  // Update Legend HTML
  els.pieLegend.innerHTML = '';
  labels.forEach((label, i) => {
    if(label === 'No Data') return;
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.innerHTML = `<div class="legend-dot" style="background: ${bgColors[i]}"></div><span>${label}</span>`;
    els.pieLegend.appendChild(item);
  });

  if (charts.pie) {
    charts.pie.data.labels = labels;
    charts.pie.data.datasets[0].data = data;
    charts.pie.data.datasets[0].backgroundColor = bgColors;
    charts.pie.update();
  } else {
    charts.pie = new Chart(els.pieChart, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: bgColors,
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(26, 31, 46, 0.9)',
            titleColor: '#e8eaf6',
            bodyColor: '#e8eaf6',
            borderColor: '#2a3050',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: function(context) {
                let label = context.label || '';
                if (label) { label += ': '; }
                if (context.raw !== null && label !== 'No Data: ') {
                  label += formatCurrency(context.raw);
                }
                return label;
              }
            }
          }
        }
      }
    });
  }
}

function updateBarChart(range) {
  if (!range) {
    const activeTab = document.querySelector('.bar-tab.active');
    range = activeTab ? parseInt(activeTab.dataset.range) : 6;
  }

  // Get last X months data
  const months = [];
  const data = [];
  
  // Parse current month
  let [year, month] = currentMonth.split('-').map(Number);
  
  // Create last X months labels and calculate totals
  for (let i = range - 1; i >= 0; i--) {
    let d = new Date(year, month - 1 - i, 1);
    let mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    let mLabel = d.toLocaleDateString('en-US', { month: 'short' });
    
    months.push(mLabel);
    
    let mExps = getExpensesForMonth(mStr);
    let mTotal = mExps.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    data.push(mTotal);
  }
  
  if (charts.bar) {
    charts.bar.data.labels = months;
    charts.bar.data.datasets[0].data = data;
    charts.bar.update();
  } else {
    // Create gradient
    const ctx = els.barChart.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(124, 108, 242, 0.8)');
    gradient.addColorStop(1, 'rgba(79, 156, 249, 0.2)');

    charts.bar = new Chart(els.barChart, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [{
          label: 'Total Spent',
          data: data,
          backgroundColor: gradient,
          borderRadius: 6,
          borderSkipped: false,
          barPercentage: 0.6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(26, 31, 46, 0.9)',
            callbacks: {
              label: (context) => formatCurrency(context.raw)
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(42, 48, 80, 0.5)' },
            ticks: { callback: (val) => '₹' + val }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  }
}

function updateReportCharts() {
  if(document.getElementById('page-reports').classList.contains('active')) {
    // We only update these if the reports page is active to save resources, 
    // or just update them anyway. We'll update them anyway for simplicity.
  }
  
  // 1. Category Breakdown (Bar) - All time or current month? Let's do current month
  const monthlyExpenses = getExpensesForMonth(currentMonth);
  const catTotals = getCategoryTotals(monthlyExpenses);
  const labels = Object.keys(CATEGORIES);
  const bgColors = labels.map(cat => getComputedStyle(document.documentElement).getPropertyValue(`--cat-${cat.toLowerCase()}`).trim() || '#fff');
  const spentData = labels.map(cat => catTotals[cat] || 0);
  const budgetData = labels.map(cat => budgets[cat] || 0);

  if(charts.reportBar) {
    charts.reportBar.data.datasets[0].data = spentData;
    charts.reportBar.update();
  } else {
    charts.reportBar = new Chart(els.reportBarChart, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Spent',
          data: spentData,
          backgroundColor: bgColors,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  // 2. Compare (Radar or grouped bar)
  if(charts.reportCompare) {
    charts.reportCompare.data.datasets[0].data = spentData;
    charts.reportCompare.data.datasets[1].data = budgetData;
    charts.reportCompare.update();
  } else {
    charts.reportCompare = new Chart(els.reportCompareChart, {
      type: 'radar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Actual Spent',
            data: spentData,
            backgroundColor: 'rgba(244, 91, 122, 0.2)',
            borderColor: 'rgba(244, 91, 122, 1)',
            pointBackgroundColor: 'rgba(244, 91, 122, 1)'
          },
          {
            label: 'Budget',
            data: budgetData,
            backgroundColor: 'rgba(61, 214, 140, 0.2)',
            borderColor: 'rgba(61, 214, 140, 1)',
            pointBackgroundColor: 'rgba(61, 214, 140, 1)'
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          r: {
            angleLines: { color: 'rgba(42, 48, 80, 0.5)' },
            grid: { color: 'rgba(42, 48, 80, 0.5)' },
            pointLabels: { color: '#9aa0bc', font: { family: 'Inter', size: 11 } },
            ticks: { display: false }
          }
        }
      }
    });
  }

  // 3. Line Chart (Trend)
  const lineLabels = [];
  const lineData = [];
  let [y, m] = currentMonth.split('-').map(Number);
  for (let i = 11; i >= 0; i--) {
    let d = new Date(y, m - 1 - i, 1);
    lineLabels.push(d.toLocaleDateString('en-US', { month: 'short' }));
    let mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    let mTotal = getExpensesForMonth(mStr).reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    lineData.push(mTotal);
  }

  if(charts.reportLine) {
    charts.reportLine.data.datasets[0].data = lineData;
    charts.reportLine.update();
  } else {
    charts.reportLine = new Chart(els.reportLineChart, {
      type: 'bar',
      data: {
        labels: lineLabels,
        datasets: [{
          label: 'Total Spending Trend',
          data: lineData,
          backgroundColor: 'rgba(124, 108, 242, 0.85)',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(42, 48, 80, 0.5)' } },
          x: { grid: { display: false } }
        }
      }
    });
  }
}

// --- EVENT LISTENERS ---
function setupEventListeners() {
  // Dashboard Edit Buttons
  document.getElementById('edit-total-spent').addEventListener('click', () => {
    const currentTotal = getExpensesForMonth(currentMonth).reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    const newValStr = prompt(`Current Total Spent is ₹${currentTotal}.\nEnter new Total Spent:`);
    if (newValStr === null || newValStr.trim() === '') return;
    const newVal = parseFloat(newValStr);
    if (!isNaN(newVal)) {
      const diff = newVal - currentTotal;
      if (diff !== 0) {
        expenses.push({
          id: generateId(),
          desc: 'Manual Adjustment',
          amount: diff,
          category: 'Other',
          date: `${currentMonth}-01`,
          notes: 'Adjusted from dashboard'
        });
        saveData();
        updateUI();
        showToast('Total spent adjusted successfully', 'success');
      }
    }
  });

  document.getElementById('edit-total-budget').addEventListener('click', () => {
    const currentTotal = globalBudgetOverride !== null ? globalBudgetOverride : Object.values(budgets).reduce((a,b)=>a+b, 0);
    const newValStr = prompt(`Current Total Budget is ₹${currentTotal}.\nEnter new Total Budget (leave empty to revert to sum of categories):`);
    if (newValStr === null) return;
    if (newValStr.trim() === '') {
      globalBudgetOverride = null;
      localStorage.removeItem('spendwise_global_budget');
    } else {
      const newVal = parseFloat(newValStr);
      if (!isNaN(newVal) && newVal >= 0) {
        globalBudgetOverride = newVal;
        localStorage.setItem('spendwise_global_budget', newVal);
      }
    }
    updateUI();
    showToast('Total budget updated successfully', 'success');
  });

  // Bar Chart Tabs
  document.querySelectorAll('.bar-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.bar-tab').forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      updateBarChart();
    });
  });

  // Navigation
  els.navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const pageId = item.getAttribute('data-page');
      
      // Update Active Nav
      els.navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
      
      // Update Page Title
      els.pageTitle.textContent = item.querySelector('.nav-label').textContent;
      
      // Show Page
      els.pages.forEach(p => p.classList.remove('active'));
      document.getElementById(`page-${pageId}`).classList.add('active');

      // Refresh charts if reports page
      if(pageId === 'reports') {
         updateReportCharts();
      }
      
      // Close sidebar on mobile
      if(window.innerWidth <= 768) {
        els.sidebar.classList.remove('open');
      }
    });
  });
  
  // Sidebar Toggle
  els.sidebarToggle.addEventListener('click', () => {
    if (window.innerWidth <= 768) {
      els.sidebar.classList.toggle('open');
    } else {
      els.sidebar.classList.toggle('closed');
      document.querySelector('.main-content').classList.toggle('expanded');
    }
  });
  
  // Month Picker
  els.monthPicker.addEventListener('change', (e) => {
    currentMonth = e.target.value;
    // Update Subtitle
    const d = new Date(currentMonth + '-01');
    document.getElementById('page-subtitle').textContent = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    updateUI();
  });
  
  // Add Expense Buttons
  document.getElementById('add-expense-btn').addEventListener('click', openExpenseModal);
  document.getElementById('add-expense-btn2').addEventListener('click', openExpenseModal);
  
  // Modals Close
  document.getElementById('modal-close').addEventListener('click', closeModals);
  document.getElementById('cancel-expense').addEventListener('click', closeModals);
  document.getElementById('budget-modal-close').addEventListener('click', closeModals);
  document.getElementById('cancel-budget').addEventListener('click', closeModals);
  
  // Other buttons
  document.getElementById('manage-budgets-btn').addEventListener('click', openBudgetModal);
  document.getElementById('view-all-btn').addEventListener('click', () => document.getElementById('nav-expenses').click());
  
  // Form Submits
  els.expenseForm.addEventListener('submit', handleExpenseSubmit);
  document.getElementById('save-budgets-btn').addEventListener('click', handleBudgetsSave);
  
  // Expenses Page Filters
  els.expenseSearch.addEventListener('input', renderExpensesTable);
  els.expenseFilterCat.addEventListener('change', renderExpensesTable);
  els.expenseSort.addEventListener('change', renderExpensesTable);
}

// --- MODAL LOGIC ---
function openExpenseModal(editId = null) {
  els.expenseForm.reset();
  document.getElementById('expense-edit-id').value = '';
  document.getElementById('modal-title').textContent = 'Add Expense';
  
  // Set default date to today or current month
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('expense-date').value = today;
  
  // If editing
  if (typeof editId === 'number') {
    const exp = expenses.find(e => e.id === editId);
    if (exp) {
      document.getElementById('modal-title').textContent = 'Edit Expense';
      document.getElementById('expense-edit-id').value = exp.id;
      document.getElementById('expense-desc').value = exp.desc;
      document.getElementById('expense-amount').value = exp.amount;
      document.getElementById('expense-category').value = exp.category;
      document.getElementById('expense-date').value = exp.date;
      document.getElementById('expense-notes').value = exp.notes || '';
    }
  }
  
  els.expenseModal.classList.add('open');
}

function closeModals() {
  els.expenseModal.classList.remove('open');
  els.budgetModal.classList.remove('open');
}

function handleExpenseSubmit(e) {
  e.preventDefault();
  
  const idVal = document.getElementById('expense-edit-id').value;
  const desc = document.getElementById('expense-desc').value.trim();
  const amount = parseFloat(document.getElementById('expense-amount').value);
  const category = document.getElementById('expense-category').value;
  const date = document.getElementById('expense-date').value;
  const notes = document.getElementById('expense-notes').value.trim();
  
  if (!desc || !amount || !category || !date) {
    showToast('Please fill all required fields', 'error');
    return;
  }
  
  const expData = {
    id: idVal ? parseInt(idVal) : generateId(),
    desc,
    amount,
    category,
    date,
    notes
  };
  
  if (idVal) {
    // Update
    const idx = expenses.findIndex(e => e.id === parseInt(idVal));
    if (idx !== -1) expenses[idx] = expData;
    showToast('Expense updated successfully', 'success');
  } else {
    // Add
    expenses.push(expData);
    showToast('Expense added successfully', 'success');
  }
  
  saveData();
  closeModals();
  updateUI();
}

window.editExpense = function(id) {
  openExpenseModal(id);
};

window.deleteExpense = function(id) {
  if (confirm('Are you sure you want to delete this expense?')) {
    expenses = expenses.filter(e => e.id !== id);
    saveData();
    updateUI();
    showToast('Expense deleted', 'success');
  }
};

// Budget Modal
function openBudgetModal() {
  const list = document.getElementById('budget-form-list');
  list.innerHTML = '';
  
  Object.keys(CATEGORIES).forEach(cat => {
    const val = budgets[cat] || 0;
    const div = document.createElement('div');
    div.className = 'budget-form-row';
    div.innerHTML = `
      <div class="budget-form-cat-name">
        <div class="budget-form-cat-dot" style="background: ${CATEGORIES[cat]}"></div>
        ${cat}
      </div>
      <div>
        <input type="number" class="budget-modal-input" data-cat="${cat}" value="${val}" min="0" step="10" placeholder="0">
      </div>
    `;
    list.appendChild(div);
  });
  
  els.budgetModal.classList.add('open');
}

function handleBudgetsSave() {
  const inputs = document.querySelectorAll('.budget-modal-input');
  inputs.forEach(input => {
    const cat = input.dataset.cat;
    const val = parseFloat(input.value) || 0;
    budgets[cat] = val;
  });
  
  saveBudgets();
  closeModals();
  updateUI();
  showToast('Budgets updated successfully', 'success');
}

// --- UTILS ---
function populateCategoryFilters() {
  const select = els.expenseFilterCat;
  Object.keys(CATEGORIES).forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = `${getCatIcon(cat)} ${cat}`;
    select.appendChild(opt);
  });
}

function getCatIcon(cat) {
  const icons = {
    'Housing': '🏠', 'Food': '🍔', 'Transport': '🚗', 'Utilities': '💡',
    'Healthcare': '🏥', 'Entertainment': '🎬', 'Shopping': '🛍️', 
    'Education': '📚', 'Savings': '💰', 'Other': '📦'
  };
  return icons[cat] || '📌';
}

function showToast(msg, type = 'success') {
  els.toast.textContent = msg;
  els.toast.className = `toast show ${type}`;
  
  setTimeout(() => {
    els.toast.classList.remove('show');
  }, 3000);
}

// Start App
document.addEventListener('DOMContentLoaded', init);
