import { Controller, useFormContext } from 'react-hook-form';
import { View } from 'react-native';
import ColorPicker, {
  Preview,
  Panel1,
  HueSlider,
  OpacitySlider,
  Swatches,
  ColorFormatsObject,
} from 'reanimated-color-picker';
import { CategoryFormValues } from '../create-category-modal';
import Label from '@/components/base/label';

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
              console.log('change', hex);
              field.onChange(hex);
            }}
            value={field.value}
          >
            <Preview
              style={{ marginBottom: 12, height: 30 }}
              hideInitialColor={true}
            />

            <View>
              <Panel1 style={{ height: 150 }} />
              <HueSlider
                style={{ marginTop: 12 }}
                sliderThickness={20}
                thumbSize={25}
              />
            </View>

            <View style={{ marginTop: 15, marginBottom: 15 }}>
              <OpacitySlider sliderThickness={20} thumbSize={25} />
            </View>

            {/* <Swatches style={{ marginTop: 14 }} /> */}
          </ColorPicker>
        </>
      )}
    />
  );
}
