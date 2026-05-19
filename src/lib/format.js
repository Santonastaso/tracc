const DATE_TIME_OPTS = {
  timeZone: 'UTC',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
};

const DATE_OPTS = {
  timeZone: 'UTC',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
};

const DATE_LONG_OPTS = {
  timeZone: 'UTC',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};

export function formatDateTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleString('it-IT', DATE_TIME_OPTS);
}

export function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('it-IT', DATE_OPTS);
}

export function formatDateLong(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('it-IT', DATE_LONG_OPTS);
}
