/** Relative-URL fetch wrapper for the Facets Control Plane — the browser attaches the session cookie automatically. */
export async function cpGet<T>(path: string): Promise<T> {
  const response = await fetch(path, { method: 'GET' });
  if (!response.ok) {
    throw new Error(`${path} -> HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}
