import { Platform } from 'react-native';

export const Brand = {
  primary: '#EA4800',
  primaryDark: '#C33D00',
  primaryLight: '#FF6A2F',
  white: '#FFFFFF',
  black: '#11181C',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray400: '#9CA3AF',
  gray600: '#4B5563',
  gray800: '#1F2937',
};

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: Brand.primary,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: Brand.primary,
    headerBackground: '#fff',
    headerBorder: '#E5E7EB',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: Brand.primaryLight,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: Brand.primaryLight,
    headerBackground: '#1C1C1E',
    headerBorder: '#2C2C2E',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
