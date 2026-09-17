import { useCallback, useEffect, useState } from 'react';
import { BackHandler } from 'react-native';

export interface UnsavedChangesGuard {
  /** Whether the "discard changes?" dialog should be shown. */
  isConfirmVisible: boolean;
  /** Leave immediately when the form is clean, otherwise ask first. */
  requestLeave: () => void;
  /** Stay on the form (dialog dismissed). */
  cancelLeave: () => void;
  /** Discard the edits and leave. */
  confirmLeave: () => void;
}

/**
 * Guards leaving a form with unsaved edits.
 *
 * Android's hardware back would otherwise walk out of a half-filled activity
 * form with no warning (the create/edit screens live inside the tab navigator
 * and stay mounted, so the draft was silently kept and could later be saved as
 * if it were the current edit). While the form is dirty, back opens a
 * confirmation instead; confirming resets the form and then runs `onLeave`.
 *
 * The caller must use `requestLeave` for its own back control too, and render a
 * dialog bound to `isConfirmVisible` / `cancelLeave` / `confirmLeave`.
 */
export function useUnsavedChangesGuard(
  isDirty: boolean,
  onLeave: () => void,
): UnsavedChangesGuard {
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);

  useEffect(() => {
    // Only intercept while there is something to lose; otherwise the platform's
    // normal back behaviour (tab history) applies.
    if (!isDirty) return;

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        setIsConfirmVisible(true);
        // Consume the press: the user decides from the dialog.
        return true;
      },
    );

    return () => subscription.remove();
  }, [isDirty]);

  const requestLeave = useCallback(() => {
    if (!isDirty) {
      onLeave();
      return;
    }
    setIsConfirmVisible(true);
  }, [isDirty, onLeave]);

  const cancelLeave = useCallback(() => setIsConfirmVisible(false), []);

  const confirmLeave = useCallback(() => {
    setIsConfirmVisible(false);
    onLeave();
  }, [onLeave]);

  return { isConfirmVisible, requestLeave, cancelLeave, confirmLeave };
}
