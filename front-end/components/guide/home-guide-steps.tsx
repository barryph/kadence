// import { Image } from 'react-native';
import { Image, ImageSource, useImage } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import GuideMediaIcon from '@/components/guide/guide-media-icon';
import type { GuideStep } from '@/components/guide/types';
import { Colors, Spacing, withAlpha } from '@/constants/theme';

function GuideGif({ source }: { source: ImageSource }) {
  const image = useImage(source);
  // Calculate aspect ratio once dimensions load
  const aspectRatio = image ? image.width / image.height : 1;

  return (
    <Image
      source={image}
      style={{
        width: '100%',
        aspectRatio,
        marginTop: Spacing.md,
        marginBottom: 0,
        borderWidth: 1,
        borderColor: withAlpha(Colors.accentGlow, 0.1),
        borderRadius: 10,
      }}
    />
  );
}

/**
 * The Steps for the Home screen onboarding guide.
 *
 * This is the file to edit when you want to change wording, swap a visual,
 * add a step, or remove one — the modal reads this array as-is.
 */
export const HOME_GUIDE_STEPS: GuideStep[] = [
  {
    title: 'Welcome',
    description:
      'Kadence is designed to adapt to real life. Most programs are a fixed plan, Kadence is flexible.',
    media: (
      <GuideMediaIcon
        accent={Colors.accentGlow}
        label="Welcome"
        icon={
          <MaterialCommunityIcons
            name="human-greeting"
            size={26}
            color={Colors.iconAccent}
          />
        }
      />
    ),
  },
  {
    title: 'Your first activity',
    description: "Tap the 'Add Activity' button to get started.",
    media: (
      <GuideMediaIcon
        accent={Colors.accentGlow}
        label="Add an activity"
        icon={<Ionicons name="add" size={26} color={Colors.iconAccent} />}
      />
    ),
  },
  {
    title: 'Queue activities',
    description:
      'Tap an activity to queue it. Queued activities move to the top.',
    media: (
      <GuideGif source={require('../../assets/demos/queue-an-activity.gif')} />
    ),
  },
  {
    title: 'Manage activities',
    description: 'Swipe left to edit, swipe right to complete it.',
    media: (
      <GuideGif source={require('../../assets/demos/activity-swipes.gif')} />
    ),
  },
  {
    title: 'Log past workouts',
    description:
      'Log previous days from the Timeline. Tap a cell to toggle it.',
    media: (
      <GuideGif source={require('../../assets/demos/timeline-toggle.gif')} />
    ),
  },
  {
    title: "That's it!",
    description: 'Jump in and get started!',
    media: (
      <GuideMediaIcon
        accent={Colors.accentGlow}
        label="Get started"
        icon={
          <MaterialCommunityIcons
            name="robot-happy"
            size={26}
            color={Colors.iconAccent}
          />
        }
      />
    ),
  },
];
