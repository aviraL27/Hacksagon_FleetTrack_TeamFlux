export function getErrorMessage(error, fallback = 'Something went wrong.') {
  return error?.response?.data?.error || error?.message || fallback;
}

export function cloneValue(value) {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
}
