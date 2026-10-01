/**
 * Local Storage & Data Management Module for FinFlow
 */

const STORAGE_KEYS = {
  TRANSACTIONS: 'finflow_transactions_v3',
  SETTINGS: 'finflow_settings_v3',
  CATEGORIES: 'finflow_categories_v3'
};

// Default Categories with FontAwesome Icons and Accent Colors
const DEFAULT_CATEGORIES = {
  expense: [
    { id: 'food', name: 'อาหาร & เครื่องดื่ม', icon: 'fa-utensils', color: '#f59e0b' },
    { id: 'transport', name: 'การเดินทาง / น้ำมัน', icon: 'fa-car', color: '#3b82f6' },
    { id: 'shopping', name: 'ช้อปปิ้ง / ของใช้', icon: 'fa-bag-shopping', color: '#ec4899' },
    { id: 'housing', name: 'ค่าที่พัก / ค่าไฟ / น้ำ', icon: 'fa-house', color: '#8b5cf6' },
    { id: 'entertainment', name: 'ความบันเทิง / ท่องเที่ยว', icon: 'fa-gamepad', color: '#06b6d4' },
    { id: 'health', name: 'สุขภาพ / ยา / รักษา', icon: 'fa-heart-pulse', color: '#ef4444' },
    { id: 'education', name: 'การศึกษา / หนังสือ', icon: 'fa-graduation-cap', color: '#10b981' },
    { id: 'family', name: 'ครอบครัว / คนรอบข้าง', icon: 'fa-users', color: '#f97316' },
    { id: 'investment', name: 'เงินออม / ลงทุน', icon: 'fa-chart-line', color: '#14b8a6' },
    { id: 'other_exp', name: 'ค่าใช้จ่ายอื่นๆ', icon: 'fa-ellipsis', color: '#64748b' }
  ],
  income: [
    { id: 'salary', name: 'เงินเดือน / ค่าจ้าง', icon: 'fa-money-bill-wave', color: '#10b981' },
    { id: 'freelance', name: 'งานเสริม / ฟรีแลนซ์', icon: 'fa-laptop-code', color: '#3b82f6' },
    { id: 'business', name: 'ธุรกิจส่วนตัว / ค้าขาย', icon: 'fa-store', color: '#f59e0b' },
    { id: 'investment_inc', name: 'เงินปันผล / ดอกเบี้ย', icon: 'fa-arrow-trend-up', color: '#8b5cf6' },
    { id: 'bonus', name: 'โบนัส / ค่าคอม', icon: 'fa-award', color: '#ec4899' },
    { id: 'gift', name: 'ของขวัญ / ได้รับมา', icon: 'fa-gift', color: '#06b6d4' },
    { id: 'other_inc', name: 'รายรับอื่นๆ', icon: 'fa-coins', color: '#14b8a6' }
  ]
};

const DEFAULT_SETTINGS = {
  theme: 'dark',
  googleSheetUrl: 'https://script.google.com/macros/s/AKfycbzYX4ldui9Z0I376L3MnVs3qcFMrdtPtzFnt7IlWkybkvR6q2QOh25lixJFlLLspA/exec',
  googleSheetId: '1RQPn-KONunwHs9UKsZEhXawROumaIN9AafxJMNsQ6AA',
  autoSync: true,
  monthlyBudget: 25000,
  currency: '฿',
  lastSyncTime: null
};

class StorageManager {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      this.saveSettings(DEFAULT_SETTINGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) {
      this.seedSampleData();
    }
  }

  getSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (data) {
        const parsed = JSON.parse(data);
        if (!parsed.googleSheetUrl) {
          parsed.googleSheetUrl = DEFAULT_SETTINGS.googleSheetUrl;
        }
        if (!parsed.googleSheetId) {
          parsed.googleSheetId = DEFAULT_SETTINGS.googleSheetId;
        }
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
      return { ...DEFAULT_SETTINGS };
    } catch (e) {
      console.error('Failed to get settings:', e);
      return { ...DEFAULT_SETTINGS };
    }
  }

  saveSettings(settings) {
    try {
      const current = this.getSettings();
      const updated = { ...current, ...settings };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }

  getCategories() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return data ? JSON.parse(data) : DEFAULT_CATEGORIES;
    } catch (e) {
      return DEFAULT_CATEGORIES;
    }
  }

  getTransactions() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      const list = data ? JSON.parse(data) : [];
      // Sort newest first
      return list.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
        const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
        return dateB - dateA;
      });
    } catch (e) {
      console.error('Failed to get transactions:', e);
      return [];
    }
  }

  saveTransactions(transactions) {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
      return true;
    } catch (e) {
      console.error('Failed to save transactions:', e);
      return false;
    }
  }

  addTransaction(item) {
    const list = this.getTransactions();
    const newItem = {
      id: item.id || 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      type: item.type || 'expense',
      amount: Number(item.amount) || 0,
      category: item.category || 'ทั่วไป',
      date: item.date || new Date().toISOString().split('T')[0],
      time: item.time || new Date().toTimeString().slice(0, 5),
      account: item.account || 'เงินสด',
      note: item.note ? item.note.trim() : '',
      tags: item.tags ? (Array.isArray(item.tags) ? item.tags : item.tags.split(',').map(t => t.trim()).filter(Boolean)) : [],
      createdAt: item.createdAt || new Date().toISOString()
    };
    list.unshift(newItem);
    this.saveTransactions(list);
    return newItem;
  }

  updateTransaction(id, updatedData) {
    const list = this.getTransactions();
    const index = list.findIndex(t => t.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updatedData, amount: Number(updatedData.amount) || 0 };
      this.saveTransactions(list);
      return list[index];
    }
    return null;
  }

  deleteTransaction(id) {
    let list = this.getTransactions();
    const initialLen = list.length;
    const targetId = String(id).trim();
    list = list.filter(t => String(t.id).trim() !== targetId);
    if (list.length !== initialLen) {
      this.saveTransactions(list);
      return true;
    }
    return false;
  }

  clearAllData() {
    this.saveTransactions([]);
  }

  seedSampleData() {
    const today = new Date();
    const formatDate = (offsetDays) => {
      const d = new Date(today);
      d.setDate(d.getDate() - offsetDays);
      return d.toISOString().split('T')[0];
    };

    const samples = [
      {
        id: 'sample-1',
        type: 'income',
        amount: 45000,
        category: 'เงินเดือน / ค่าจ้าง',
        date: formatDate(1),
        time: '09:00',
        account: 'บัญชีธนาคาร',
        note: 'เงินเดือนประจำเดือน',
        tags: ['เงินเดือน', 'ประจำ']
      },
      {
        id: 'sample-2',
        type: 'income',
        amount: 8500,
        category: 'งานเสริม / ฟรีแลนซ์',
        date: formatDate(3),
        time: '14:30',
        account: 'พร้อมเพย์',
        note: 'ค่าออกแบบเว็บไซต์โปรเจกต์ A',
        tags: ['ฟรีแลนซ์']
      },
      {
        id: 'sample-3',
        type: 'expense',
        amount: 1500,
        category: 'อาหาร & เครื่องดื่ม',
        date: formatDate(0),
        time: '12:30',
        account: 'พร้อมเพย์',
        note: 'กินบุฟเฟต์ปิ้งย่างกับเพื่อน',
        tags: ['อาหาร', 'สังสรรค์']
      },
      {
        id: 'sample-4',
        type: 'expense',
        amount: 1200,
        category: 'การเดินทาง / น้ำมัน',
        date: formatDate(1),
        time: '08:15',
        account: 'บัตรเครดิต',
        note: 'เติมน้ำมันรถยนต์เต็มถัง',
        tags: ['น้ำมัน']
      },
      {
        id: 'sample-5',
        type: 'expense',
        amount: 6500,
        category: 'ค่าที่พัก / ค่าไฟ / น้ำ',
        date: formatDate(2),
        time: '10:00',
        account: 'บัญชีธนาคาร',
        note: 'ค่าเช่าคอนโด + ค่าน้ำค่าไฟ',
        tags: ['บิล']
      },
      {
        id: 'sample-6',
        type: 'expense',
        amount: 890,
        category: 'ช้อปปิ้ง / ของใช้',
        date: formatDate(2),
        time: '19:20',
        account: 'TrueMoney',
        note: 'ซื้อของใช้ในบ้านจากซูเปอร์มาร์เก็ต',
        tags: ['ของใช้']
      },
      {
        id: 'sample-7',
        type: 'expense',
        amount: 350,
        category: 'ความบันเทิง / ท่องเที่ยว',
        date: formatDate(4),
        time: '20:00',
        account: 'บัตรเครดิต',
        note: 'ตั๋วชมภาพยนตร์ + ป๊อปคอร์น',
        tags: ['หนัง']
      }
    ];

    this.saveTransactions(samples);
  }

  exportToCSV() {
    const list = this.getTransactions();
    if (!list.length) {
      alert('ไม่มีข้อมูลสำหรับส่งออก');
      return;
    }

    const headers = ['ID', 'วันที่', 'เวลา', 'ประเภท', 'หมวดหมู่', 'จำนวนเงิน', 'ช่องทางการเงิน', 'บันทึกช่วยจำ', 'แท็ก'];
    const rows = list.map(t => [
      `"${t.id}"`,
      `"${t.date}"`,
      `"${t.time}"`,
      `"${t.type === 'income' ? 'รายรับ' : 'รายจ่าย'}"`,
      `"${t.category}"`,
      t.amount,
      `"${t.account}"`,
      `"${(t.note || '').replace(/"/g, '""')}"`,
      `"${Array.isArray(t.tags) ? t.tags.join(', ') : (t.tags || '')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `finflow_backup_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  exportToJSON() {
    const list = this.getTransactions();
    const settings = this.getSettings();
    const exportData = {
      version: '3.0',
      exportedAt: new Date().toISOString(),
      settings: settings,
      transactions: list
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `finflow_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  importFromJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data)) {
        this.saveTransactions(data);
        return { success: true, count: data.length };
      } else if (data.transactions && Array.isArray(data.transactions)) {
        this.saveTransactions(data.transactions);
        if (data.settings) {
          this.saveSettings(data.settings);
        }
        return { success: true, count: data.transactions.length };
      }
      return { success: false, message: 'รูปแบบไฟล์ JSON ไม่ถูกต้อง' };
    } catch (e) {
      return { success: false, message: 'เกิดข้อผิดพลาดในการอ่านไฟล์ JSON: ' + e.message };
    }
  }
}

window.storageManager = new StorageManager();
