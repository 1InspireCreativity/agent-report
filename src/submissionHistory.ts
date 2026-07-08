import type { SubmissionRecord } from './types';

const STORAGE_KEY = 'storylineSubmissionHistory';
const MAX_RECORDS = 50;

export function loadSubmissionHistory(): SubmissionRecord[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function addSubmissionRecord(record: Omit<SubmissionRecord, 'id' | 'submitted_at'>): SubmissionRecord[] {
  const arr = loadSubmissionHistory();
  const full: SubmissionRecord = {
    ...record,
    id: String(Date.now()),
    submitted_at: new Date().toLocaleString(),
  };
  arr.unshift(full);
  if (arr.length > MAX_RECORDS) arr.length = MAX_RECORDS;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  return arr;
}

export function deleteSubmissionRecord(id: string): SubmissionRecord[] {
  const arr = loadSubmissionHistory().filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  return arr;
}

export function clearSubmissionHistory(): SubmissionRecord[] {
  localStorage.removeItem(STORAGE_KEY);
  return [];
}
