import { useColorScheme } from "@/hooks/use-color-scheme";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import LoadingScreen from "@/lib/Loading";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { PaperProvider } from "react-native-paper";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

export const unstable_settings = {
  anchor: "(tabs)",
};

function RouteGard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useAuth(); // Replace with your authentication logic
  const segments = useSegments();

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const isAuth = segments[0] === "auth";

    if (!user && !isAuth && !isLoading) {
      router.replace("/auth");
    } else if (user && isAuth && !isLoading) {
      console.log(user);
      router.replace("/");
    }

    if (!isLoading) {
      setIsReady(true);
    }
    setTimeout(() => {
      return <LoadingScreen message="Gating user data..." />;
    }, 2000);
  }, [user, segments, isLoading]);

  if (!isReady) {
    return <LoadingScreen message="Initializing app..." />;
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <PaperProvider>
          <SafeAreaProvider>
            <RouteGard>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              </Stack>
              <StatusBar style="auto" />
            </RouteGard>
          </SafeAreaProvider>
        </PaperProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
