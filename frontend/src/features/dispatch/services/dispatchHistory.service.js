/**
 * features/dispatch/services/dispatchHistory.service.js
 *
 * Local history persistence for dispatch status timeline.
 *
 * Why localStorage:
 * - Backend currently does not expose full timeline history.
 * - This keeps a lightweight UI history for operators.
 */

const DISPATCH_HISTORY_STORAGE_KEY = 'bfpacs_dispatch_history';

function buildHistoryKey(dispatchId, incidentId) {
  return `${incidentId}::${dispatchId}`;
}

function readHistoryMap() {
  try {
    return JSON.parse(localStorage.getItem(DISPATCH_HISTORY_STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function writeHistoryMap(historyMap) {
  localStorage.setItem(DISPATCH_HISTORY_STORAGE_KEY, JSON.stringify(historyMap));
}

export function getDispatchHistory(dispatchId, incidentId) {
  const historyMap = readHistoryMap();
  return historyMap[buildHistoryKey(dispatchId, incidentId)] ?? [];
}

export function appendDispatchHistory({
  dispatchId,
  incidentId,
  fromStatus,
  toStatus,
  label,
}) {
  const historyMap = readHistoryMap();
  const historyKey = buildHistoryKey(dispatchId, incidentId);

  if (!historyMap[historyKey]) {
    historyMap[historyKey] = [];
  }

  historyMap[historyKey].push({
    label,
    prev: fromStatus,
    status: toStatus,
    ts: new Date().toISOString(),
  });

  writeHistoryMap(historyMap);
}
