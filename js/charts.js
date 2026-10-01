/**
 * Chart.js Visualizations & Analytics Module for FinFlow
 */

class AnalyticsManager {
  constructor() {
    this.trendChart = null;
    this.categoryChart = null;
  }

  isDarkMode() {
    return document.documentElement.getAttribute('data-theme') !== 'light';
  }

  getChartThemeColors() {
    const isDark = this.isDarkMode();
    return {
      textColor: isDark ? '#94a3b8' : '#475569',
      gridColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.06)',
      tooltipBg: isDark ? '#1e293b' : '#ffffff',
      tooltipText: isDark ? '#f8fafc' : '#0f172a',
      borderColor: isDark ? '#334155' : '#cbd5e1'
    };
  }

  /**
   * Render or update the Income vs Expense Trend Bar Chart
   */
  renderTrendChart(canvasId, filteredTransactions) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const theme = this.getChartThemeColors();

    // Group transactions by date (last 7-14 days or by month)
    const dateMap = {};
    
    // Sort transactions by date ascending for timeline chart
    const sorted = [...filteredTransactions].sort((a, b) => new Date(a.date) - new Date(b.date));

    sorted.forEach(t => {
      const d = t.date;
      if (!dateMap[d]) {
        dateMap[d] = { income: 0, expense: 0 };
      }
      if (t.type === 'income') {
        dateMap[d].income += Number(t.amount) || 0;
      } else {
        dateMap[d].expense += Number(t.amount) || 0;
      }
    });

    const labels = Object.keys(dateMap);
    const formattedLabels = labels.map(d => {
      const parts = d.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}`;
      }
      return d;
    });

    const incomeData = labels.map(d => dateMap[d].income);
    const expenseData = labels.map(d => dateMap[d].expense);

    if (this.trendChart) {
      this.trendChart.destroy();
    }

    this.trendChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: formattedLabels.length ? formattedLabels : ['ไม่มีข้อมูล'],
        datasets: [
          {
            label: 'รายรับ (Income)',
            data: incomeData.length ? incomeData : [0],
            backgroundColor: '#10b981',
            borderRadius: 6,
            barPercentage: 0.6,
            categoryPercentage: 0.8
          },
          {
            label: 'รายจ่าย (Expense)',
            data: expenseData.length ? expenseData : [0],
            backgroundColor: '#f43f5e',
            borderRadius: 6,
            barPercentage: 0.6,
            categoryPercentage: 0.8
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: theme.textColor,
              font: { family: 'Prompt', size: 12, weight: '500' },
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: theme.tooltipBg,
            titleColor: theme.tooltipText,
            bodyColor: theme.tooltipText,
            borderColor: theme.borderColor,
            borderWidth: 1,
            padding: 10,
            boxPadding: 4,
            usePointStyle: true,
            callbacks: {
              label: (context) => {
                return ` ${context.dataset.label}: ฿${context.parsed.y.toLocaleString('th-TH')}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: theme.textColor,
              font: { family: 'Prompt', size: 11 }
            }
          },
          y: {
            grid: { color: theme.gridColor },
            ticks: {
              color: theme.textColor,
              font: { family: 'Prompt', size: 11 },
              callback: (value) => '฿' + value.toLocaleString('th-TH')
            }
          }
        }
      }
    });
  }

  /**
   * Render or update Category Breakdown Doughnut Chart
   */
  renderCategoryChart(canvasId, filteredTransactions, type = 'expense') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const theme = this.getChartThemeColors();

    const categoryTotals = {};
    filteredTransactions
      .filter(t => t.type === type)
      .forEach(t => {
        const cat = t.category || 'อื่นๆ';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + (Number(t.amount) || 0);
      });

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);

    // Color palette for doughnut
    const palette = [
      '#2563eb', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6',
      '#06b6d4', '#f43f5e', '#14b8a6', '#f97316', '#64748b'
    ];

    if (this.categoryChart) {
      this.categoryChart.destroy();
    }

    if (labels.length === 0) {
      this.categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['ไม่มีรายการ'],
          datasets: [{
            data: [1],
            backgroundColor: [theme.gridColor],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '72%',
          plugins: {
            legend: { display: false },
            tooltip: { enabled: false }
          }
        }
      });
      return;
    }

    this.categoryChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: palette.slice(0, labels.length),
          borderWidth: 2,
          borderColor: this.isDarkMode() ? '#0f172a' : '#ffffff',
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: theme.textColor,
              font: { family: 'Prompt', size: 11 },
              usePointStyle: true,
              pointStyle: 'circle',
              boxWidth: 8
            }
          },
          tooltip: {
            backgroundColor: theme.tooltipBg,
            titleColor: theme.tooltipText,
            bodyColor: theme.tooltipText,
            borderColor: theme.borderColor,
            borderWidth: 1,
            padding: 10,
            callbacks: {
              label: (context) => {
                const val = context.parsed;
                const total = data.reduce((a, b) => a + b, 0);
                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                return ` ${context.label}: ฿${val.toLocaleString('th-TH')} (${pct}%)`;
              }
            }
          }
        }
      }
    });
  }

  updateAllCharts(transactions, activeCategoryType = 'expense') {
    this.renderTrendChart('trendChartCanvas', transactions);
    this.renderCategoryChart('categoryChartCanvas', transactions, activeCategoryType);
  }
}

window.analyticsManager = new AnalyticsManager();
