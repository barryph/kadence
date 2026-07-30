import { act } from '@testing-library/react-native';

export async function flushPromises() {
  await act(async () => {
    await new Promise((resolve) => setImmediate(resolve));
  });
}
