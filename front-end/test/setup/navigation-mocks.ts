export const mockReplace = jest.fn();
export const mockPush = jest.fn();
export const mockBack = jest.fn();

export function resetNavigationMocks() {
  mockReplace.mockClear();
  mockPush.mockClear();
  mockBack.mockClear();
}
