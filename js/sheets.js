/**
 * Google Sheets API Integration Service (via Google Apps Script Web App)
 */

class GoogleSheetService {
  constructor() {
    this.status = 'idle'; // 'idle', 'syncing', 'synced', 'error', 'offline'
    this.listeners = [];
  }

  onStatusChange(callback) {
    this.listeners.push(callback);
  }

  notifyStatus(status, details = '') {
    this.status = status;
    this.listeners.forEach(cb => cb(status, details));
  }

  getUrl() {
    const settings = window.storageManager.getSettings();
    return (settings.googleSheetUrl || '').trim();
  }

  getSheetId() {
    const settings = window.storageManager.getSettings();
    const raw = (settings.googleSheetId || '').trim();
    if (!raw) return '';
    // Extract ID if user pastes full URL: https://docs.google.com/spreadsheets/d/XXXXXX/edit
    const match = raw.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : raw;
  }

  /**
   * Helper function for sending POST data to Google Apps Script.
   * Uses text/plain to prevent CORS preflight OPTIONS rejection from Google Script.
   */
  async postToScript(url, payload) {
    const sheetId = this.getSheetId();
    const fullPayload = { ...payload, sheetId: sheetId || undefined };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(fullPayload)
    });

    return await response.json();
  }

  /**
   * Test connection to Google Sheet
   */
  async testConnection(url) {
    const targetUrl = url || this.getUrl();
    if (!targetUrl) {
      throw new Error('กรุณาระบุ URL ของ Google Apps Script');
    }

    this.notifyStatus('syncing', 'กำลังตรวจสอบการเชื่อมต่อ...');
    try {
      const result = await this.postToScript(targetUrl, { action: 'test' });
      if (result && result.status === 'success') {
        this.notifyStatus('synced', 'เชื่อมต่อสำเร็จ');
        return { success: true, message: result.message || 'เชื่อมต่อ Google Sheet สำเร็จ' };
      } else {
        throw new Error(result.message || 'ไม่สามารถเชื่อมต่อได้');
      }
    } catch (err) {
      this.notifyStatus('error', err.message);
      throw err;
    }
  }

  /**
   * Add a single transaction to Google Sheet
   */
  async addTransaction(item) {
    const url = this.getUrl();
    if (!url) return { success: false, reason: 'no_url' };

    this.notifyStatus('syncing', 'กำลังบันทึกลง Google Sheet...');
    try {
      const res = await this.postToScript(url, {
        action: 'add',
        data: item
      });
      this.notifyStatus('synced', 'บันทึกลง Google Sheet เรียบร้อย');
      this.updateLastSyncTime();
      return { success: true, result: res };
    } catch (err) {
      console.warn('Google Sheet add sync failed (will remain in local storage):', err);
      this.notifyStatus('error', 'ซิงค์ล้มเหลว: ' + err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Delete a transaction from Google Sheet
   */
  async deleteTransaction(id) {
    const url = this.getUrl();
    if (!url) return { success: false, reason: 'no_url' };

    this.notifyStatus('syncing', 'กำลังลบรายการใน Google Sheet...');
    try {
      const res = await this.postToScript(url, {
        action: 'delete',
        id: id
      });
      this.notifyStatus('synced', 'ลบจาก Google Sheet เรียบร้อย');
      this.updateLastSyncTime();
      return { success: true, result: res };
    } catch (err) {
      console.warn('Google Sheet delete sync failed:', err);
      this.notifyStatus('error', 'ลบใน Google Sheet ล้มเหลว');
      return { success: false, error: err.message };
    }
  }

  /**
   * Sync all local transactions to Google Sheet (Overwrites Sheet data with local data)
   */
  async syncAllToSheet(transactions) {
    const url = this.getUrl();
    if (!url) {
      throw new Error('กรุณาระบุ URL ของ Google Apps Script ในหน้าตั้งค่าก่อน');
    }

    this.notifyStatus('syncing', `กำลังซิงค์ ${transactions.length} รายการ ไปยัง Google Sheet...`);
    try {
      const res = await this.postToScript(url, {
        action: 'sync_all',
        data: transactions
      });

      if (res && res.status === 'success') {
        this.notifyStatus('synced', `ซิงค์สำเร็จ (${transactions.length} รายการ)`);
        this.updateLastSyncTime();
        return { success: true, message: res.message };
      } else {
        throw new Error(res.message || 'ซิงค์ไม่สำเร็จ');
      }
    } catch (err) {
      this.notifyStatus('error', 'ซิงค์ข้อมูลล้มเหลว: ' + err.message);
      throw err;
    }
  }

  /**
   * Fetch all transactions from Google Sheet and merge/replace local storage
   */
  async fetchFromSheet() {
    const url = this.getUrl();
    if (!url) {
      throw new Error('กรุณาระบุ URL ของ Google Apps Script ในหน้าตั้งค่าก่อน');
    }

    this.notifyStatus('syncing', 'กำลังดึงข้อมูลจาก Google Sheet...');
    try {
      const sheetId = this.getSheetId();
      const sheetParam = sheetId ? `&sheetId=${encodeURIComponent(sheetId)}` : '';
      const res = await fetch(url + (url.includes('?') ? '&' : '?') + 'action=get&t=' + Date.now() + sheetParam);
      const data = await res.json();

      if (data && data.status === 'success' && Array.isArray(data.transactions)) {
        this.notifyStatus('synced', `ดึงข้อมูลสำเร็จ (${data.transactions.length} รายการ)`);
        this.updateLastSyncTime();
        return { success: true, transactions: data.transactions };
      } else {
        throw new Error(data.message || 'ไม่พบข้อมูลใน Google Sheet');
      }
    } catch (err) {
      this.notifyStatus('error', 'ดึงข้อมูลล้มเหลว: ' + err.message);
      throw err;
    }
  }

  updateLastSyncTime() {
    const now = new Date().toISOString();
    window.storageManager.saveSettings({ lastSyncTime: now });
  }
}

window.googleSheetService = new GoogleSheetService();
