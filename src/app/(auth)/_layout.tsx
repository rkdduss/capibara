import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack 
        screenOptions={{ headerShown: false }} 
    >
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="splash" />
    </Stack>
  );
}