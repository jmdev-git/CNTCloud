import { AcknowledgmentRecord } from '@/types';

const ACK_KEY = 'acknowledgments';
const EMAIL_KEY = 'employeeEmail';

const read = (): AcknowledgmentRecord[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(ACK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const write = (records: AcknowledgmentRecord[]) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ACK_KEY, JSON.stringify(records));
  } catch {
    /* no-op */
  }
};

export const hasAcknowledged = (memoId: string, email: string): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check that the email matches a record for this memo
  const records = read();
  return records.some(
    r => r.memo_id === memoId && r.employee_email.toLowerCase() === email.toLowerCase()
  );
};

export const recordAcknowledgment = (record: AcknowledgmentRecord) => {
  const records = read();
  
  // 1. Check if (memo_id + email) already exists to avoid duplicates
  const exists = records.find(
    r => r.memo_id === record.memo_id && 
         r.employee_email.toLowerCase() === record.employee_email.toLowerCase()
  );
  
  if (!exists) {
    // 2. Append new record (JSON-like append)
    records.push(record);
    write(records);
    
    // 3. Trigger a custom event to notify components that acknowledgments have updated
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('acknowledgments-updated'));
    }
  }

  // 4. Set browser-specific flag for THIS user's session
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(`memo_read_${record.memo_id}`, 'true');
  }
};

export const clearAllAcknowledgments = () => {
  if (typeof window === 'undefined') return;
  try {
    // Clear global records
    window.localStorage.removeItem(ACK_KEY);
    window.localStorage.removeItem(EMAIL_KEY);
    
    // Clear all per-memo browser flags
    Object.keys(window.localStorage).forEach(key => {
      if (key.startsWith('memo_read_')) {
        window.localStorage.removeItem(key);
      }
    });
  } catch {
    /* no-op */
  }
};

export const getAllAcknowledgments = (_trigger?: unknown): AcknowledgmentRecord[] => read();

export const getEmployeeEmail = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(EMAIL_KEY);
  } catch {
    return null;
  }
};

export const setEmployeeEmail = (email: string) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(EMAIL_KEY, email);
  } catch {
    /* no-op */
  }
};
