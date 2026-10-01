/**
 * Mobile-First Application Controller for FinFlow
 */

document.addEventListener('DOMContentLoaded', () => {
  // ------------------------------------------------------------------------
  // State
  // ------------------------------------------------------------------------
  let currentDate = new Date();
  let selectedPeriod = 'month'; // 'month', 'today', 'all'
  let activeTab = 'viewHome'; // 'viewHome', 'viewTransactions', 'viewAnalytics', 'viewSettings'
  let searchQuery = '';
  let filterType = 'all'; // 'all', 'expense', 'income'
  let activeCategoryBreakdownType = 'expense';
  let editingId = null;
  let selectedDetailId = null;

  // ------------------------------------------------------------------------
  // DOM Elements
  // ------------------------------------------------------------------------
  const htmlRoot = document.documentElement;
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeIcon = document.getElementById('themeIcon');
  const syncDot = document.getElementById('syncDot');
  const btnHeaderSync = document.getElementById('btnHeaderSync');
  const headerSubtitle = document.getElementById('headerSubtitle');

  // SPA Views & Bottom Nav
  const appViews = document.querySelectorAll('.app-view');
  const navItems = document.querySelectorAll('.nav-item');
  const centerFabBtn = document.getElementById('centerFabBtn');
  const btnSeeAllTx = document.getElementById('btnSeeAllTx');
  const periodRibbon = document.getElementById('periodRibbon');

  // Date Ribbon
  const periodPills = document.querySelectorAll('#periodRibbon .period-pill');
  const prevDateBtn = document.getElementById('prevDateBtn');
  const nextDateBtn = document.getElementById('nextDateBtn');
  const currentDateLabel = document.getElementById('currentDateLabel');

  // Home View Elements
  const heroTotalBalance = document.getElementById('heroTotalBalance');
  const heroTotalIncome = document.getElementById('heroTotalIncome');
  const heroTotalExpense = document.getElementById('heroTotalExpense');
  const heroSavingsBadge = document.getElementById('heroSavingsBadge');
  const homeBudgetBar = document.getElementById('homeBudgetBar');
  const homeBudgetRemaining = document.getElementById('homeBudgetRemaining');
  const homeBudgetSpent = document.getElementById('homeBudgetSpent');
  const homeBudgetTotal = document.getElementById('homeBudgetTotal');
  const homeRecentTxList = document.getElementById('homeRecentTxList');
  const quickAddIncomeBtn = document.getElementById('quickAddIncomeBtn');
  const quickAddExpenseBtn = document.getElementById('quickAddExpenseBtn');

  // Transactions View Elements
  const mobileSearchInput = document.getElementById('mobileSearchInput');
  const filterChips = document.querySelectorAll('#filterChipRow .filter-chip');
  const fullTransactionList = document.getElementById('fullTransactionList');

  // Analytics View Elements
  const catToggleExpense = document.getElementById('catToggleExpense');
  const catToggleIncome = document.getElementById('catToggleIncome');
  const analyticsCategoryList = document.getElementById('analyticsCategoryList');

  // Bottom Sheet: Add / Edit Transaction
  const txSheetOverlay = document.getElementById('txSheetOverlay');
  const txSheetTitle = document.getElementById('txSheetTitle');
  const btnCloseTxSheet = document.getElementById('btnCloseTxSheet');
  const btnCancelTxSheet = document.getElementById('btnCancelTxSheet');
  const mobileTxForm = document.getElementById('mobileTxForm');
  const formTxType = document.getElementById('formTxType');
  const btnToggleExp = document.getElementById('btnToggleExp');
  const btnToggleInc = document.getElementById('btnToggleInc');
  const formTxAmount = document.getElementById('formTxAmount');
  const formTxCategory = document.getElementById('formTxCategory');
  const mobileCatPicker = document.getElementById('mobileCatPicker');
  const formTxDate = document.getElementById('formTxDate');
  const formTxTime = document.getElementById('formTxTime');
  const formTxAccount = document.getElementById('formTxAccount');
  const formTxNote = document.getElementById('formTxNote');
  const formTxTags = document.getElementById('formTxTags');
  const chipAmounts = document.querySelectorAll('.chip-amount');

  // Bottom Sheet: Details
  const detailSheetOverlay = document.getElementById('detailSheetOverlay');
  const btnCloseDetailSheet = document.getElementById('btnCloseDetailSheet');
  const detailSheetContent = document.getElementById('detailSheetContent');
  const btnDeleteFromDetail = document.getElementById('btnDeleteFromDetail');
  const btnEditFromDetail = document.getElementById('btnEditFromDetail');

  // Settings View Elements
  const mobileSettingsForm = document.getElementById('mobileSettingsForm');
  const sheetUrlInput = document.getElementById('sheetUrlInput');
  const sheetIdInput = document.getElementById('sheetIdInput');
  const autoSyncCheck = document.getElementById('autoSyncCheck');
  const btnTestConn = document.getElementById('btnTestConn');
  const btnSyncAll = document.getElementById('btnSyncAll');
  const btnFetchAll = document.getElementById('btnFetchAll');
  const btnCopyScriptMobile = document.getElementById('btnCopyScriptMobile');
  const budgetLimitInput = document.getElementById('budgetLimitInput');
  const btnSaveBudget = document.getElementById('btnSaveBudget');
  const btnMobileExportCSV = document.getElementById('btnMobileExportCSV');
  const btnMobileExportJSON = document.getElementById('btnMobileExportJSON');
  const mobileJsonFile = document.getElementById('mobileJsonFile');
  const btnMobileSeedDemo = document.getElementById('btnMobileSeedDemo');
  const btnMobileClearAll = document.getElementById('btnMobileClearAll');

  // Toast Container
  const toastContainer = document.getElementById('toastContainer');

  // ------------------------------------------------------------------------
  // Toast Notifications
  // ------------------------------------------------------------------------
  function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast-msg ${type}`;
    
    let icon = 'fa-info-circle text-blue';
    if (type === 'success') icon = 'fa-circle-check text-green';
    if (type === 'error') icon = 'fa-circle-exclamation text-rose';

    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-15px)';
      setTimeout(() => toast.remove(), 250);
    }, duration);
  }

  // ------------------------------------------------------------------------
  // Theme Management (Dark & Light Mode)
  // ------------------------------------------------------------------------
  function applyTheme(theme) {
    htmlRoot.setAttribute('data-theme', theme);
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (theme === 'light') {
      themeIcon.className = 'fa-solid fa-sun';
      if (metaThemeColor) metaThemeColor.setAttribute('content', '#f1f5f9');
    } else {
      themeIcon.className = 'fa-solid fa-moon';
      if (metaThemeColor) metaThemeColor.setAttribute('content', '#080c15');
    }
    window.storageManager.saveSettings({ theme });
    refreshUI();
  }

  const initialSettings = window.storageManager.getSettings();
  applyTheme(initialSettings.theme || 'dark');

  themeToggleBtn.addEventListener('click', () => {
    const current = htmlRoot.getAttribute('data-theme') || 'dark';
    const nextTheme = current === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    showToast(`เปลี่ยนเป็นโหมด${nextTheme === 'light' ? 'สว่าง' : 'มืด'}`, 'info');
  });

  // ------------------------------------------------------------------------
  // Google Sheets Service Status Listeners
  // ------------------------------------------------------------------------
  window.googleSheetService.onStatusChange((status) => {
    syncDot.className = `sync-dot-badge ${status}`;
  });

  if (initialSettings.googleSheetUrl) {
    syncDot.className = 'sync-dot-badge synced';
    sheetUrlInput.value = initialSettings.googleSheetUrl;
  } else {
    syncDot.className = 'sync-dot-badge offline';
  }
  sheetIdInput.value = initialSettings.googleSheetId || '';
  autoSyncCheck.checked = initialSettings.autoSync !== false;
  budgetLimitInput.value = initialSettings.monthlyBudget || 25000;

  // ------------------------------------------------------------------------
  // Bottom Navigation (SPA View Switching)
  // ------------------------------------------------------------------------
  function switchTab(viewId) {
    activeTab = viewId;
    appViews.forEach(v => v.classList.remove('active'));
    navItems.forEach(n => n.classList.remove('active'));

    const targetView = document.getElementById(viewId);
    if (targetView) targetView.classList.add('active');

    const activeNav = document.querySelector(`.nav-item[data-target="${viewId}"]`);
    if (activeNav) activeNav.classList.add('active');

    // Update Header Subtitle & Date Ribbon visibility
    if (viewId === 'viewHome') {
      headerSubtitle.textContent = 'บันทึกรายรับ-รายจ่าย';
      periodRibbon.style.display = 'flex';
    } else if (viewId === 'viewTransactions') {
      headerSubtitle.textContent = 'รายการธุรกรรมทั้งหมด';
      periodRibbon.style.display = 'flex';
    } else if (viewId === 'viewAnalytics') {
      headerSubtitle.textContent = 'สถิติและกราฟวิเคราะห์';
      periodRibbon.style.display = 'flex';
    } else if (viewId === 'viewSettings') {
      headerSubtitle.textContent = 'ตั้งค่าระบบ';
      periodRibbon.style.display = 'none';
    }

    refreshUI();
  }

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const target = item.getAttribute('data-target');
      if (target) switchTab(target);
    });
  });

  if (btnSeeAllTx) {
    btnSeeAllTx.addEventListener('click', () => switchTab('viewTransactions'));
  }

  btnHeaderSync.addEventListener('click', () => switchTab('viewSettings'));

  // ------------------------------------------------------------------------
  // Date & Period Management
  // ------------------------------------------------------------------------
  function updatePeriodLabel() {
    const thaiMonths = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];

    if (selectedPeriod === 'month') {
      const m = thaiMonths[currentDate.getMonth()];
      const y = (currentDate.getFullYear() + 543).toString().slice(-2);
      currentDateLabel.textContent = `${m} ${y}`;
      prevDateBtn.style.visibility = 'visible';
      nextDateBtn.style.visibility = 'visible';
    } else if (selectedPeriod === 'today') {
      const d = currentDate.getDate();
      const m = thaiMonths[currentDate.getMonth()];
      currentDateLabel.textContent = `${d} ${m}`;
      prevDateBtn.style.visibility = 'visible';
      nextDateBtn.style.visibility = 'visible';
    } else {
      currentDateLabel.textContent = 'ทั้งหมด';
      prevDateBtn.style.visibility = 'hidden';
      nextDateBtn.style.visibility = 'hidden';
    }
  }

  periodPills.forEach(pill => {
    pill.addEventListener('click', () => {
      periodPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      selectedPeriod = pill.getAttribute('data-period');
      refreshUI();
    });
  });

  prevDateBtn.addEventListener('click', () => {
    if (selectedPeriod === 'month') {
      currentDate.setMonth(currentDate.getMonth() - 1);
    } else if (selectedPeriod === 'today') {
      currentDate.setDate(currentDate.getDate() - 1);
    }
    refreshUI();
  });

  nextDateBtn.addEventListener('click', () => {
    if (selectedPeriod === 'month') {
      currentDate.setMonth(currentDate.getMonth() + 1);
    } else if (selectedPeriod === 'today') {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    refreshUI();
  });

  // ------------------------------------------------------------------------
  // Data Filtering
  // ------------------------------------------------------------------------
  function getFilteredTransactions() {
    const all = window.storageManager.getTransactions();
    const currYear = currentDate.getFullYear();
    const currMonth = currentDate.getMonth();
    const currDay = currentDate.getDate();

    return all.filter(t => {
      const txDate = new Date(`${t.date}T00:00:00`);
      
      if (selectedPeriod === 'month') {
        if (txDate.getFullYear() !== currYear || txDate.getMonth() !== currMonth) {
          return false;
        }
      } else if (selectedPeriod === 'today') {
        if (
          txDate.getFullYear() !== currYear ||
          txDate.getMonth() !== currMonth ||
          txDate.getDate() !== currDay
        ) {
          return false;
        }
      }

      if (filterType !== 'all' && t.type !== filterType) {
        return false;
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchCat = (t.category || '').toLowerCase().includes(q);
        const matchNote = (t.note || '').toLowerCase().includes(q);
        const matchAcc = (t.account || '').toLowerCase().includes(q);
        const matchTags = Array.isArray(t.tags) ? t.tags.some(tag => tag.toLowerCase().includes(q)) : false;
        if (!matchCat && !matchNote && !matchAcc && !matchTags) return false;
      }

      return true;
    });
  }

  // Filter chips in Transactions view
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      filterType = chip.getAttribute('data-type');
      refreshUI();
    });
  });

  mobileSearchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim();
    refreshUI();
  });

  // ------------------------------------------------------------------------
  // Category Picker Rendering for Bottom Sheet
  // ------------------------------------------------------------------------
  function renderCategoryPicker(type = 'expense', selectedCategory = '') {
    const categories = window.storageManager.getCategories();
    const list = categories[type] || [];
    mobileCatPicker.innerHTML = '';

    list.forEach((cat, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `cat-picker-item ${selectedCategory === cat.name || (!selectedCategory && index === 0) ? 'active' : ''}`;
      btn.innerHTML = `
        <i class="fa-solid ${cat.icon}" style="color: ${cat.color}"></i>
        <span>${cat.name}</span>
      `;

      btn.addEventListener('click', () => {
        document.querySelectorAll('.cat-picker-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        formTxCategory.value = cat.name;
      });

      mobileCatPicker.appendChild(btn);
    });

    if (!selectedCategory && list.length > 0) {
      formTxCategory.value = list[0].name;
    } else if (selectedCategory) {
      formTxCategory.value = selectedCategory;
    }
  }

  function getCategoryMeta(categoryName, type) {
    const categories = window.storageManager.getCategories();
    const catList = categories[type] || [];
    const found = catList.find(c => c.name === categoryName);
    if (found) {
      return { icon: found.icon, color: found.color };
    }
    return {
      icon: type === 'income' ? 'fa-coins' : 'fa-receipt',
      color: type === 'income' ? '#10b981' : '#f43f5e'
    };
  }

  // ------------------------------------------------------------------------
  // Bottom Sheet Form Controls (Add/Edit)
  // ------------------------------------------------------------------------
  function setFormType(type) {
    formTxType.value = type;
    if (type === 'income') {
      btnToggleInc.classList.add('active', 'inc');
      btnToggleExp.classList.remove('active', 'exp');
    } else {
      btnToggleExp.classList.add('active', 'exp');
      btnToggleInc.classList.remove('active', 'inc');
    }
  }

  btnToggleExp.addEventListener('click', () => {
    setFormType('expense');
    renderCategoryPicker('expense');
  });

  btnToggleInc.addEventListener('click', () => {
    setFormType('income');
    renderCategoryPicker('income');
  });

  // Quick Amount Add chips (+50, +100, +500, +1,000)
  chipAmounts.forEach(chip => {
    chip.addEventListener('click', () => {
      const addVal = Number(chip.getAttribute('data-add')) || 0;
      const currentVal = Number(formTxAmount.value) || 0;
      formTxAmount.value = currentVal + addVal;
    });
  });

  function openAddSheet(type = 'expense') {
    editingId = null;
    txSheetTitle.innerHTML = `<i class="fa-solid fa-plus-circle text-blue"></i> บันทึกรายการใหม่`;
    mobileTxForm.reset();

    const now = new Date();
    formTxDate.value = now.toISOString().split('T')[0];
    formTxTime.value = now.toTimeString().slice(0, 5);

    setFormType(type);
    renderCategoryPicker(type);

    txSheetOverlay.classList.add('active');
    setTimeout(() => formTxAmount.focus(), 150);
  }

  function openEditSheet(id) {
    const list = window.storageManager.getTransactions();
    const item = list.find(t => t.id === id);
    if (!item) return;

    editingId = id;
    txSheetTitle.innerHTML = `<i class="fa-solid fa-pen-to-square text-blue"></i> แก้ไขรายการ`;

    formTxAmount.value = item.amount;
    formTxDate.value = item.date;
    formTxTime.value = item.time || '12:00';
    formTxAccount.value = item.account || 'เงินสด';
    formTxNote.value = item.note || '';
    formTxTags.value = Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || '');

    setFormType(item.type);
    renderCategoryPicker(item.type, item.category);

    txSheetOverlay.classList.add('active');
  }

  function closeAddSheet() {
    txSheetOverlay.classList.remove('active');
  }

  centerFabBtn.addEventListener('click', () => openAddSheet('expense'));
  quickAddIncomeBtn.addEventListener('click', () => openAddSheet('income'));
  quickAddExpenseBtn.addEventListener('click', () => openAddSheet('expense'));
  btnCloseTxSheet.addEventListener('click', closeAddSheet);
  btnCancelTxSheet.addEventListener('click', closeAddSheet);

  // Form Submit
  mobileTxForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const amt = parseFloat(formTxAmount.value);
    if (!amt || amt <= 0) {
      showToast('กรุณากรอกจำนวนเงินให้ถูกต้อง', 'error');
      formTxAmount.focus();
      return;
    }

    const itemData = {
      type: formTxType.value,
      amount: amt,
      category: formTxCategory.value || 'ทั่วไป',
      date: formTxDate.value,
      time: formTxTime.value,
      account: formTxAccount.value,
      note: formTxNote.value,
      tags: formTxTags.value
    };

    let savedItem;
    if (editingId) {
      savedItem = window.storageManager.updateTransaction(editingId, itemData);
      showToast('แก้ไขรายการสำเร็จ', 'success');
    } else {
      savedItem = window.storageManager.addTransaction(itemData);
      showToast('บันทึกรายการสำเร็จ', 'success');
    }

    closeAddSheet();
    refreshUI();

    // Auto sync
    const settings = window.storageManager.getSettings();
    if (settings.autoSync && settings.googleSheetUrl) {
      window.googleSheetService.addTransaction(savedItem);
    }
  });

  // ------------------------------------------------------------------------
  // Transaction Details Bottom Sheet
  // ------------------------------------------------------------------------
  function openDetailSheet(id) {
    selectedDetailId = id;
    const list = window.storageManager.getTransactions();
    const item = list.find(t => t.id === id);
    if (!item) return;

    const meta = getCategoryMeta(item.category, item.type);
    const sign = item.type === 'income' ? '+' : '-';
    const typeLabel = item.type === 'income' ? 'รายรับ (Income)' : 'รายจ่าย (Expense)';
    const amountColor = item.type === 'income' ? 'var(--green-primary)' : 'var(--rose-primary)';

    detailSheetContent.innerHTML = `
      <div style="text-align: center; margin-bottom: 1.25rem;">
        <div style="width: 56px; height: 56px; margin: 0 auto 0.6rem auto; border-radius: 50%; background: ${item.type === 'income' ? 'var(--green-subtle)' : 'var(--rose-subtle)'}; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: ${meta.color};">
          <i class="fa-solid ${meta.icon}"></i>
        </div>
        <h4 style="font-size: 1.1rem; font-weight: 700;">${item.category}</h4>
        <div style="font-size: 1.8rem; font-weight: 800; color: ${amountColor}; margin-top: 0.2rem;">
          ${sign}฿${Number(item.amount).toLocaleString('th-TH')}
        </div>
      </div>

      <div class="detail-row">
        <span class="detail-label">ประเภท</span>
        <span class="detail-val">${typeLabel}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">วันที่ & เวลา</span>
        <span class="detail-val">${item.date} • ${item.time || '--:--'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">ช่องทางการเงิน</span>
        <span class="detail-val">${item.account || 'เงินสด'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">บันทึกช่วยจำ</span>
        <span class="detail-val">${item.note || '-'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">แท็ก</span>
        <span class="detail-val">${Array.isArray(item.tags) && item.tags.length ? item.tags.join(', ') : (item.tags || '-')}</span>
      </div>
    `;

    resetDeleteButton();
    detailSheetOverlay.classList.add('active');
  }

  function closeDetailSheet() {
    detailSheetOverlay.classList.remove('active');
    resetDeleteButton();
  }

  btnCloseDetailSheet.addEventListener('click', closeDetailSheet);

  btnEditFromDetail.addEventListener('click', () => {
    if (selectedDetailId) {
      const id = selectedDetailId;
      closeDetailSheet();
      openEditSheet(id);
    }
  });

  let deleteConfirmTimeout = null;

  function resetDeleteButton() {
    btnDeleteFromDetail.removeAttribute('data-confirming');
    btnDeleteFromDetail.innerHTML = '<i class="fa-solid fa-trash-can"></i> ลบรายการ';
    btnDeleteFromDetail.style.background = 'var(--bg-pill)';
    btnDeleteFromDetail.style.color = 'var(--rose-primary)';
    btnDeleteFromDetail.style.borderColor = 'rgba(244, 63, 94, 0.3)';
    if (deleteConfirmTimeout) {
      clearTimeout(deleteConfirmTimeout);
      deleteConfirmTimeout = null;
    }
  }

  btnDeleteFromDetail.addEventListener('click', (e) => {
    e.preventDefault();
    if (!selectedDetailId) return;

    // First click: Ask confirmation inline on the button
    if (!btnDeleteFromDetail.getAttribute('data-confirming')) {
      btnDeleteFromDetail.setAttribute('data-confirming', 'true');
      btnDeleteFromDetail.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> ยืนยันลบ?';
      btnDeleteFromDetail.style.background = 'var(--rose-primary)';
      btnDeleteFromDetail.style.color = '#ffffff';
      btnDeleteFromDetail.style.borderColor = 'var(--rose-primary)';

      deleteConfirmTimeout = setTimeout(() => {
        resetDeleteButton();
      }, 4000);
      return;
    }

    // Second click: Perform the deletion
    resetDeleteButton();

    const id = selectedDetailId;
    window.storageManager.deleteTransaction(id);
    showToast('ลบรายการเรียบร้อยแล้ว', 'info');
    closeDetailSheet();
    refreshUI();

    const settings = window.storageManager.getSettings();
    if (settings.autoSync && settings.googleSheetUrl) {
      window.googleSheetService.deleteTransaction(id);
    }
  });

  // Close overlays on clicking backdrop
  [txSheetOverlay, detailSheetOverlay].forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
      }
    });
  });

  // ------------------------------------------------------------------------
  // Render Dashboard Metrics & Summaries
  // ------------------------------------------------------------------------
  function renderMetrics(filtered) {
    let income = 0;
    let expense = 0;

    filtered.forEach(t => {
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') income += amt;
      else expense += amt;
    });

    const balance = income - expense;
    const settings = window.storageManager.getSettings();
    const budget = Number(settings.monthlyBudget) || 25000;

    // Home wallet cards
    heroTotalBalance.textContent = '฿' + balance.toLocaleString('th-TH');
    heroTotalIncome.textContent = '+฿' + income.toLocaleString('th-TH');
    heroTotalExpense.textContent = '-฿' + expense.toLocaleString('th-TH');

    let savingsRate = 0;
    if (income > 0) {
      savingsRate = Math.max(0, Math.round(((income - expense) / income) * 100));
    }
    heroSavingsBadge.innerHTML = `<i class="fa-solid fa-arrow-trend-up"></i> ออม ${savingsRate}%`;

    // Budget Tracker
    const spentPct = budget > 0 ? Math.min(100, Math.round((expense / budget) * 100)) : 0;
    homeBudgetSpent.textContent = '฿' + expense.toLocaleString('th-TH');
    homeBudgetTotal.textContent = '฿' + budget.toLocaleString('th-TH');
    const remaining = Math.max(0, budget - expense);
    homeBudgetRemaining.textContent = '฿' + remaining.toLocaleString('th-TH');

    homeBudgetBar.style.width = `${spentPct}%`;
    homeBudgetBar.className = 'progress-fill';
    if (spentPct >= 90) homeBudgetBar.classList.add('danger');
    else if (spentPct >= 70) homeBudgetBar.classList.add('warning');
  }

  // ------------------------------------------------------------------------
  // Render Transaction Cards (Reusable for Home & Transactions view)
  // ------------------------------------------------------------------------
  function buildTransactionCardHtml(t) {
    const meta = getCategoryMeta(t.category, t.type);
    const sign = t.type === 'income' ? '+' : '-';
    const typeClass = t.type === 'income' ? 'inc' : 'exp';
    const bgSubtle = t.type === 'income' ? 'var(--green-subtle)' : 'var(--rose-subtle)';

    return `
      <div class="tx-card" data-id="${t.id}">
        <div class="tx-left">
          <div class="tx-icon-box" style="background: ${bgSubtle}; color: ${meta.color};">
            <i class="fa-solid ${meta.icon}"></i>
          </div>
          <div class="tx-info">
            <span class="tx-name">${t.category}</span>
            <div class="tx-meta">
              <span>${t.time || '--:--'}</span>
              <span class="tx-pill">${t.account || 'เงินสด'}</span>
              ${t.note ? `<span>• ${t.note}</span>` : ''}
            </div>
          </div>
        </div>
        <div class="tx-right">
          <span class="tx-amount ${typeClass}">${sign}฿${Number(t.amount).toLocaleString('th-TH')}</span>
        </div>
      </div>
    `;
  }

  function formatThaiHeader(dateStr) {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (dateStr === today) return 'วันนี้ (Today)';
    if (dateStr === yesterday) return 'เมื่อวานนี้ (Yesterday)';

    const d = new Date(`${dateStr}T00:00:00`);
    const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return `${d.getDate()} ${thaiMonths[d.getMonth()]} ${d.getFullYear() + 543}`;
  }

  function renderTransactions(filtered) {
    // 1. Home View (Show up to 5 recent transactions)
    const recent = filtered.slice(0, 5);
    if (!recent.length) {
      homeRecentTxList.innerHTML = `<div style="text-align:center; padding: 1.5rem; color: var(--text-muted); font-size: 0.85rem;">ยังไม่มีรายการในรอบนี้</div>`;
    } else {
      homeRecentTxList.innerHTML = recent.map(t => buildTransactionCardHtml(t)).join('');
    }

    // 2. Full Transactions View (Grouped by date)
    if (!filtered.length) {
      fullTransactionList.innerHTML = `
        <div style="text-align:center; padding: 2.5rem 1rem; color: var(--text-muted);">
          <i class="fa-solid fa-receipt" style="font-size: 2.2rem; margin-bottom: 0.5rem; opacity: 0.4;"></i>
          <p style="font-size: 0.9rem;">ไม่พบรายการธุรกรรม</p>
        </div>
      `;
    } else {
      const groups = {};
      filtered.forEach(t => {
        if (!groups[t.date]) groups[t.date] = [];
        groups[t.date].push(t);
      });

      let fullHtml = '';
      const sortedDates = Object.keys(groups).sort((a, b) => new Date(b) - new Date(a));
      sortedDates.forEach(d => {
        fullHtml += `<div class="tx-group-title">${formatThaiHeader(d)}</div>`;
        groups[d].forEach(t => {
          fullHtml += buildTransactionCardHtml(t);
        });
      });
      fullTransactionList.innerHTML = fullHtml;
    }

    // Attach click listeners to all transaction cards
    document.querySelectorAll('.tx-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-id');
        if (id) openDetailSheet(id);
      });
    });
  }

  // ------------------------------------------------------------------------
  // Render Analytics & Category Breakdown
  // ------------------------------------------------------------------------
  function renderAnalyticsCategory(filtered, type = 'expense') {
    const categoryTotals = {};
    let grandTotal = 0;

    filtered
      .filter(t => t.type === type)
      .forEach(t => {
        const cat = t.category || 'อื่นๆ';
        const amt = Number(t.amount) || 0;
        categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
        grandTotal += amt;
      });

    const entries = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    if (!entries.length) {
      analyticsCategoryList.innerHTML = `<div style="text-align:center; padding: 0.75rem; color: var(--text-muted); font-size: 0.8rem;">ไม่มีรายการ${type === 'expense' ? 'รายจ่าย' : 'รายรับ'}</div>`;
      return;
    }

    const palette = ['#2563eb', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f43f5e', '#14b8a6', '#f97316', '#64748b'];

    let html = '';
    entries.forEach(([cat, amt], idx) => {
      const pct = grandTotal > 0 ? ((amt / grandTotal) * 100).toFixed(1) : 0;
      const color = palette[idx % palette.length];
      html += `
        <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.82rem; padding: 0.35rem 0; border-bottom: 1px solid var(--border-subtle);">
          <div style="display: flex; align-items: center; gap: 0.45rem;">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: ${color};"></div>
            <span>${cat}</span>
          </div>
          <div style="font-weight: 700;">
            <span>฿${amt.toLocaleString('th-TH')}</span>
            <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: normal; margin-left: 0.3rem;">(${pct}%)</span>
          </div>
        </div>
      `;
    });
    analyticsCategoryList.innerHTML = html;
  }

  catToggleExpense.addEventListener('click', () => {
    activeCategoryBreakdownType = 'expense';
    catToggleExpense.classList.add('active');
    catToggleIncome.classList.remove('active');
    refreshUI();
  });

  catToggleIncome.addEventListener('click', () => {
    activeCategoryBreakdownType = 'income';
    catToggleIncome.classList.add('active');
    catToggleExpense.classList.remove('active');
    refreshUI();
  });

  // ------------------------------------------------------------------------
  // Refresh UI
  // ------------------------------------------------------------------------
  function refreshUI() {
    updatePeriodLabel();
    const filtered = getFilteredTransactions();
    renderMetrics(filtered);
    renderTransactions(filtered);
    renderAnalyticsCategory(filtered, activeCategoryBreakdownType);

    if (window.analyticsManager && (activeTab === 'viewAnalytics' || activeTab === 'viewHome')) {
      window.analyticsManager.updateAllCharts(filtered, activeCategoryBreakdownType);
    }
  }

  // ------------------------------------------------------------------------
  // Settings & Google Sheets Handlers
  // ------------------------------------------------------------------------
  mobileSettingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const updated = {
      googleSheetUrl: sheetUrlInput.value.trim(),
      googleSheetId: sheetIdInput.value.trim(),
      autoSync: autoSyncCheck.checked
    };
    window.storageManager.saveSettings(updated);
    showToast('บันทึกการตั้งค่าเรียบร้อยแล้ว', 'success');
  });

  btnTestConn.addEventListener('click', async () => {
    const url = sheetUrlInput.value.trim();
    if (!url) {
      showToast('กรุณาระบุ URL ก่อนทดสอบ', 'error');
      return;
    }
    btnTestConn.disabled = true;
    btnTestConn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังทดสอบ...';
    try {
      const res = await window.googleSheetService.testConnection(url);
      showToast(res.message || 'เชื่อมต่อสำเร็จ!', 'success');
    } catch (err) {
      showToast('เกิดข้อผิดพลาด: ' + err.message, 'error');
    } finally {
      btnTestConn.disabled = false;
      btnTestConn.innerHTML = '<i class="fa-solid fa-link"></i> ทดสอบ';
    }
  });

  btnSyncAll.addEventListener('click', async () => {
    const list = window.storageManager.getTransactions();
    if (!list.length) {
      showToast('ไม่มีข้อมูลสำหรับซิงค์', 'error');
      return;
    }
    if (!confirm(`ส่งข้อมูล ${list.length} รายการใช่หรือไม่?`)) return;

    btnSyncAll.disabled = true;
    btnSyncAll.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังส่ง...';
    try {
      const res = await window.googleSheetService.syncAllToSheet(list);
      showToast(res.message || 'ส่งข้อมูลเรียบร้อยแล้ว!', 'success');
    } catch (err) {
      showToast('ซิงค์ล้มเหลว: ' + err.message, 'error');
    } finally {
      btnSyncAll.disabled = false;
      btnSyncAll.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> ส่งข้อมูล';
    }
  });

  btnFetchAll.addEventListener('click', async () => {
    if (!confirm('ดึงข้อมูลมาแทนที่ข้อมูลปัจจุบัน?')) return;
    btnFetchAll.disabled = true;
    btnFetchAll.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังดึง...';
    try {
      const res = await window.googleSheetService.fetchFromSheet();
      if (res.success && res.transactions) {
        window.storageManager.saveTransactions(res.transactions);
        showToast(`ดึงข้อมูล ${res.transactions.length} รายการเรียบร้อยแล้ว`, 'success');
        refreshUI();
      }
    } catch (err) {
      showToast('ดึงข้อมูลล้มเหลว: ' + err.message, 'error');
    } finally {
      btnFetchAll.disabled = false;
      btnFetchAll.innerHTML = '<i class="fa-solid fa-cloud-arrow-down"></i> ดึงข้อมูล';
    }
  });

  if (btnCopyScriptMobile) {
    btnCopyScriptMobile.addEventListener('click', () => {
      const codeEl = document.getElementById('scriptCodeText');
      if (codeEl) {
        navigator.clipboard.writeText(codeEl.innerText).then(() => {
          showToast('คัดลอกโค้ด Apps Script แล้ว!', 'success');
          btnCopyScriptMobile.innerHTML = '<i class="fa-solid fa-check"></i> แล้ว';
          setTimeout(() => {
            btnCopyScriptMobile.innerHTML = '<i class="fa-solid fa-copy"></i> คัดลอก';
          }, 2000);
        });
      }
    });
  }

  btnSaveBudget.addEventListener('click', () => {
    const val = Number(budgetLimitInput.value) || 25000;
    window.storageManager.saveSettings({ monthlyBudget: val });
    showToast('บันทึกงบประมาณเรียบร้อย', 'success');
    refreshUI();
  });

  btnMobileExportCSV.addEventListener('click', () => {
    window.storageManager.exportToCSV();
    showToast('ดาวน์โหลด CSV สำเร็จ', 'success');
  });

  btnMobileExportJSON.addEventListener('click', () => {
    window.storageManager.exportToJSON();
    showToast('ดาวน์โหลด JSON สำเร็จ', 'success');
  });

  mobileJsonFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = window.storageManager.importFromJSON(event.target.result);
      if (result.success) {
        showToast(`นำเข้าข้อมูล ${result.count} รายการสำเร็จ`, 'success');
        refreshUI();
      } else {
        showToast(result.message, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  btnMobileSeedDemo.addEventListener('click', () => {
    if (confirm('โหลดข้อมูลตัวอย่างสำหรับทดสอบ?')) {
      window.storageManager.seedSampleData();
      showToast('โหลดข้อมูลตัวอย่างแล้ว', 'success');
      refreshUI();
    }
  });

  btnMobileClearAll.addEventListener('click', () => {
    if (confirm('คุณแน่ใจว่าต้องการล้างข้อมูลทั้งหมด?')) {
      window.storageManager.clearAllData();
      showToast('ลบข้อมูลทั้งหมดแล้ว', 'info');
      refreshUI();
    }
  });

  // ------------------------------------------------------------------------
  // Initialize
  // ------------------------------------------------------------------------
  refreshUI();
});
