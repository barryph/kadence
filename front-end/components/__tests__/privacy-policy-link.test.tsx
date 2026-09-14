import React from 'react';
import { Linking } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
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
});
