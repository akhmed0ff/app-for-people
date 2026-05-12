import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/shared/store/auth.store';

export default function Index() {
  const accessToken = useAuthStore((state) => state.accessToken);
  return <Redirect href={accessToken ? '/(tabs)' : '/(auth)/phone'} />;
}
