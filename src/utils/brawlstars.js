export function sanitizeTag(rawTag) {
  if (!rawTag) return '';
  const clean = rawTag.trim().toUpperCase().replace(/[^0-9A-Z]/g, '');
  return clean ? '#' + clean : '';
}

export function encodeTag(rawTag) {
  const clean = rawTag.trim().toUpperCase().replace(/[^0-9A-Z]/g, '');
  return '%23' + clean;
}
