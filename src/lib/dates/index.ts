export function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function formatDateForInput(date: Date) {
  return date.toISOString().slice(0, 10);
}
