export function expectErrorBody(
  body: { error?: { code?: string; message?: string; statusCode?: number } },
  expected: { code?: string; message?: string; statusCode?: number },
): void {
  expect(body.error).toBeDefined();
  if (expected.code !== undefined) {
    expect(body.error?.code).toBe(expected.code);
  }
  if (expected.message !== undefined) {
    expect(body.error?.message).toBe(expected.message);
  }
  if (expected.statusCode !== undefined) {
    expect(body.error?.statusCode).toBe(expected.statusCode);
  }
}
