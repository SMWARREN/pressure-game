import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import MainScreen from '../components/MainScreen.native';

export const unstable_settings = {
  anchor: 'index',
};

export default function RootLayout() {
  return (
    <ThemeProvider value={DarkTheme}>
      <MainScreen />
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
