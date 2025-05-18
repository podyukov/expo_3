import { Slot } from 'expo-router';
import { MarkerProvider } from '../context/MarkerContext';

export default function RootLayout() {
  return (
    <MarkerProvider>
      <Slot />
    </MarkerProvider>
  );
}
