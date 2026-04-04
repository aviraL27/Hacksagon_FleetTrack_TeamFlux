export function cn(...values) {
  return values.flatMap((value) => {
    if (!value) {
      return [];
    }

    return typeof value === 'string' ? [value] : [];
  }).join(' ');
}
