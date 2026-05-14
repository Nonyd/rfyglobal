/** Supports Next 14 sync params and Next 15+ `params` as a Promise. */
export async function paramId(
  params: { id: string } | Promise<{ id: string }>,
): Promise<string | undefined> {
  const p = await Promise.resolve(params)
  const id = typeof p?.id === 'string' ? p.id.trim() : ''
  return id || undefined
}
