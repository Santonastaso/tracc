export function getNested(obj, path) {
  if (!obj || !path) return undefined;
  if (path.indexOf('.') === -1) return obj[path];
  return path.split('.').reduce(
    (acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined),
    obj
  );
}
