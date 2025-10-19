import { useAuth } from "@/lib/auth-context";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { Button, Text, TextInput, useTheme } from "react-native-paper";

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [err, setErr] = useState<string | null>("");
  const toggleForm = () => setIsSignUp(!isSignUp);

  const { signIn, signUp } = useAuth();

  const theme = useTheme();
  const route = useRouter();

  const router = useRouter();
  const { user, isLoading } = useAuth(); // Replace with your authentication logic

  useEffect(() => {
    if (user && !isLoading) {
      console.log(user);
      router.replace("/");
    }
    setTimeout(() => {}, 2000);
  }, [user, isLoading]);

  const handleAuth = async () => {
    if (!email || !password) {
      setErr("Email and Password are required");
      return;
    }
    if (password.length < 6) {
      setErr("Password must be at least 6 characters");
      return;
    }
    setErr(null);

    if (isSignUp) {
      const error = await signUp(email, password);
      if (error) {
        setErr(error);
        return;
      }
    } else {
      const error = await signIn(email, password);
      if (error) {
        setErr(error);
        return;
      }

      route.replace("/");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "hight"}
      style={style.container}
    >
      <View>
        <Text style={style.title}>
          {isSignUp ? "Create Account" : "Welcome Back"}
        </Text>
        <TextInput
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="example@gmail.com"
          mode="outlined"
          onChangeText={setEmail}
          style={style.input}
        />
        <TextInput
          label="Password"
          autoCapitalize="none"
          mode="outlined"
          onChangeText={setPassword}
          style={style.input}
          secureTextEntry
        />
        {err && (
          <Text style={{ color: theme.colors.error, marginBottom: 8 }}>
            {err}
          </Text>
        )}

        <Button
          mode="contained"
          style={style.button}
          onPress={handleAuth}
          disabled={!email || !password}
        >
          {isSignUp ? "Sign Up" : "Sign In"}
        </Button>
        <Button mode="text" onPress={toggleForm} style={style.link}>
          {isSignUp
            ? "Already have an account? Sign In"
            : "Don't have an account? Sign Up"}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: "center",
    fontWeight: "bold",
  },
  link: {
    marginTop: 8,
    textAlign: "center",
    color: "blue",
    textDecorationLine: "underline",
  },
});
