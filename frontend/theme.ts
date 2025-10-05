import { MD3LightTheme } from 'react-native-paper';

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6B8AFF', // Soft blue from your images
    primaryContainer: '#E8EEFF',
    secondary: '#5B6CFF',
    secondaryContainer: '#F0F4FF',
    surface: '#FFFFFF',
    surfaceVariant: '#F5F7FA',
    background: '#F8FAFB', // Light background with slight blue tint
    error: '#FF6B6B',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onSurface: '#1A1D2E', // Dark text
    onBackground: '#1A1D2E',
    outline: '#E0E5ED',
    outlineVariant: '#CDD5E0',
    text: '#1A1D2E',
    placeholder: '#9CA3AF',
  },
};
