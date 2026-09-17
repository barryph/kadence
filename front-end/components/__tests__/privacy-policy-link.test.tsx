import React from 'react';
import { Linking } from 'react-native';
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react-native';
import Toast from 'react-native-toast-message';
import PrivacyPolicyLink from '@/components/privacy-policy-link';
import { PRIVACY_POLICY_URL } from '@/constants/urls';

describe('PrivacyPolicyLink', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders an accessible Privacy Policy link', async () => {
    await render(<PrivacyPolicyLink />);

    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toBeTruthy();
    expect(screen.getByText('Privacy Policy')).toBeTruthy();
  });

  it('opens the Privacy Policy externally when pressed', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);

    await render(<PrivacyPolicyLink />);
    await fireEvent.press(screen.getByRole('link', { name: 'Privacy Policy' }));

    expect(openURL).toHaveBeenCalledWith(PRIVACY_POLICY_URL);
  });

  it('tells the user when no app can open the link', async () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    jest
      .spyOn(Linking, 'openURL')
      .mockRejectedValue(new Error('Unable to open URL'));
    const toastShow = Toast.show as jest.Mock;
    toastShow.mockClear();

    await render(<PrivacyPolicyLink />);
    await fireEvent.press(screen.getByRole('link', { name: 'Privacy Policy' }));

    await waitFor(() => {
      expect(toastShow).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          text1: "Couldn't open the Privacy Policy",
        }),
      );
    });
    consoleSpy.mockRestore();
  });
});
