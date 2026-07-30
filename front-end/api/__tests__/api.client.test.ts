import { apiClient } from '../api.client';
import { ErrorCode } from '../api.types';

const mockFetch = jest.fn();
global.fetch = mockFetch;

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

describe('apiClient', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns data on successful GET', async () => {
    mockFetch.mockReturnValue(
      jsonResponse({ data: { user: { id: '1', email: 'test@example.com' } } }),
    );

    const result = await apiClient.get<{ user: { id: string; email: string } }>(
      '/users/current',
    );

    expect(result.data?.user.email).toBe('test@example.com');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/users/current',
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
      }),
    );
  });

  it('returns mapped error when server returns error payload', async () => {
    mockFetch.mockReturnValue(
      jsonResponse({
        error: { code: 'INVALID_CREDENTIALS', message: 'Bad credentials' },
      }),
    );

    const result = await apiClient.post('/auth/login', {
      email: 'bad@example.com',
      password: 'wrong',
    });

    expect(result.error?.code).toBe(ErrorCode.INVALID_CREDENTIALS);
    expect(result.error?.message).toBe(
      'Invalid email or password, please try again.',
    );
  });

  it('returns generic error on non-OK response without error payload', async () => {
    mockFetch.mockReturnValue(
      jsonResponse({ data: null }, 500),
    );

    const result = await apiClient.get('/activities');

    expect(result.error?.code).toBe(ErrorCode.GENERIC_ERROR);
  });

  it('returns undefined data on successful DELETE', async () => {
    mockFetch.mockReturnValue(
      Promise.resolve({ ok: true, status: 204, json: () => Promise.resolve({}) }),
    );

    const result = await apiClient.delete('/auth/logout');

    expect(result.data).toBeUndefined();
    expect(result.error).toBeUndefined();
  });

  it('returns error on failed DELETE', async () => {
    mockFetch.mockReturnValue(
      Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) }),
    );

    const result = await apiClient.delete('/auth/logout');

    expect(result.error?.code).toBe(ErrorCode.GENERIC_ERROR);
  });

  it('returns network error on fetch TypeError', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockFetch.mockRejectedValue(new TypeError('Network request failed'));

    const result = await apiClient.get('/activities');

    expect(result.error?.code).toBe(ErrorCode.NETWORK_ERROR);
    expect(result.error?.message).toBe(
      'Network error. Please check your connection.',
    );
    consoleSpy.mockRestore();
  });

  it('sends POST body as JSON', async () => {
    mockFetch.mockReturnValue(jsonResponse({ data: { activity: { id: 1 } } }));

    await apiClient.post('/activities', { name: 'Run', interval: 7 });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/activities',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Run', interval: 7 }),
      }),
    );
  });
});
