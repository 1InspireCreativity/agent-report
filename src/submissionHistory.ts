import type { SubmissionRecord } from './types';

export const STORYLINE_SUBMIT_HISTORY_KEY = 'storylineSubmissionHistory';
export const REPORT_SUBMIT_HISTORY_KEY = 'reportSubmissionHistory';

const MAX_RECORDS = 50;

export function loadSubmissionHistory(storageKey: string): SubmissionRecord[] {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || '[]');
  } catch {
    return [];
  }
}

export function addSubmissionRecord(
  storageKey: string,
  record: Omit<SubmissionRecord, 'id' | 'submitted_at'>
): SubmissionRecord[] {
  const arr = loadSubmissionHistory(storageKey);
  const full: SubmissionRecord = {
    ...record,
    id: String(Date.now()),
    submitted_at: new Date().toLocaleString(),
  };
  arr.unshift(full);
  if (arr.length > MAX_RECORDS) arr.length = MAX_RECORDS;
  localStorage.setItem(storageKey, JSON.stringify(arr));
  return arr;
}

export function deleteSubmissionRecord(storageKey: string, id: string): SubmissionRecord[] {
  const arr = loadSubmissionHistory(storageKey).filter((r) => r.id !== id);
  localStorage.setItem(storageKey, JSON.stringify(arr));
  return arr;
}

export function clearSubmissionHistory(storageKey: string): SubmissionRecord[] {
  localStorage.removeItem(storageKey);
  return [];
}
