import React from 'react';
import { BackHandler, Pressable, Text } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { useUnsavedChangesGuard } from '@/hooks/use-unsaved-changes-guard';

const onLeave = jest.fn();

function Probe({ isDirty }: { isDirty: boolean }) {
  const guard = useUnsavedChangesGuard(isDirty, onLeave);

  return (
    <>
      <Text>{guard.isConfirmVisible ? 'confirming' : 'idle'}</Text>
      <Pressable
        accessibilityLabel="request leave"
        onPress={guard.requestLeave}
      >
        <Text>request leave</Text>
      </Pressable>
      <Pressable accessibilityLabel="keep editing" onPress={guard.cancelLeave}>
        <Text>keep editing</Text>
      </Pressable>
      <Pressable accessibilityLabel="discard" onPress={guard.confirmLeave}>
        <Text>discard</Text>
      </Pressable>
    </>
  );
}

function pressHardwareBack() {
  const handler = (BackHandler.addEventListener as jest.Mock).mock.calls.find(
    ([event]) => event === 'hardwareBackPress',
  )?.[1] as (() => boolean) | undefined;

  if (!handler) throw new Error('no hardwareBackPress listener registered');
  return handler();
}

describe('useUnsavedChangesGuard', () => {
  beforeEach(() => {
    onLeave.mockClear();
    jest.spyOn(BackHandler, 'addEventListener');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('leaves immediately when the form has no unsaved edits', async () => {
    await render(<Probe isDirty={false} />);

    await act(async () => {
      await fireEvent.press(screen.getByLabelText('request leave'));
    });

    expect(onLeave).toHaveBeenCalledTimes(1);
    expect(screen.getByText('idle')).toBeTruthy();
  });

  it('asks before leaving when the form is dirty', async () => {
    await render(<Probe isDirty />);

    await act(async () => {
      await fireEvent.press(screen.getByLabelText('request leave'));
    });

    expect(screen.getByText('confirming')).toBeTruthy();
    expect(onLeave).not.toHaveBeenCalled();

    await act(async () => {
      await fireEvent.press(screen.getByLabelText('keep editing'));
    });
    expect(screen.getByText('idle')).toBeTruthy();
    expect(onLeave).not.toHaveBeenCalled();

    await act(async () => {
      await fireEvent.press(screen.getByLabelText('discard'));
    });
    expect(onLeave).toHaveBeenCalledTimes(1);
  });

  it('intercepts the hardware back button while the form is dirty', async () => {
    await render(<Probe isDirty />);

    let handled: boolean | undefined;
    await act(async () => {
      handled = pressHardwareBack();
    });

    // The press is consumed so the navigator does not leave the screen.
    expect(handled).toBe(true);
    expect(screen.getByText('confirming')).toBeTruthy();
    expect(onLeave).not.toHaveBeenCalled();
  });

  it('does not intercept the hardware back button when the form is clean', async () => {
    await render(<Probe isDirty={false} />);

    const handler = (BackHandler.addEventListener as jest.Mock).mock.calls.find(
      ([event]) => event === 'hardwareBackPress',
    );
    expect(handler).toBeUndefined();
  });
});
