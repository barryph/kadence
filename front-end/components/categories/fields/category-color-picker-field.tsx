import { Controller, useFormContext } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import ColorPicker, {
  Preview,
  Panel1,
  HueSlider,
  OpacitySlider,
  Swatches,
  ColorFormatsObject,
} from 'reanimated-color-picker';
import Label from '@/components/base/label';
import { CategoryColors, Spacing } from '@/constants/theme';
import { CategoryFormValues } from '../category-modal';

export default function CategoryColorPickerField() {
  const { control } = useFormContext<CategoryFormValues>();

  return (
    <Controller
      control={control}
      name="color"
      render={({ field }) => (
        <>
          <Label>Color</Label>
          {/** Color picker **/}
          <ColorPicker
            onCompleteJS={({ hex }: ColorFormatsObject) => {
              field.onChange(hex);
            }}
            value={field.value}
          >
            <Preview style={styles.preview} hideInitialColor={true} />

            <View>
              <Panel1 style={styles.panel} />
              <HueSlider
                style={styles.hueSlider}
                sliderThickness={20}
                thumbSize={25}
              />
            </View>

            <View style={styles.opacitySliderRow}>
              <OpacitySlider sliderThickness={20} thumbSize={25} />
            </View>

            <Swatches style={styles.swatches} colors={[...CategoryColors]} />
          </ColorPicker>
        </>
      )}
    />
  );
}

const styles = StyleSheet.create({
  preview: {
    marginBottom: Spacing.xl,
    height: 30,
  },
  panel: {
    height: 150,
  },
  hueSlider: {
    marginTop: Spacing.xl,
  },
  opacitySliderRow: {
    marginTop: 15,
    marginBottom: 15,
  },
  swatches: {
    marginTop: 14,
  },
});
