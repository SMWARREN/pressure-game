import { StatusBar } from 'expo-status-bar';
import PressureApp from '../components/PressureApp';

export default function RootLayout() {
  return (
    <>
      <PressureApp style={{ flex: 1 }} />
      <StatusBar style="light" hidden />
    </>
  );
}
