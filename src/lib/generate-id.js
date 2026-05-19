export function generateId() {
  return `ID_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
