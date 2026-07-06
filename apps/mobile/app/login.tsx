import { useState } from "react";
import { Redirect } from "expo-router";
import { KeyboardAvoidingView } from "react-native";
import { Card, Field, Message, PageIntro, PasswordField, PrimaryButton, Screen } from "../src/components/ui";
import { useAuth } from "../src/auth/auth-context";

export default function LoginScreen() {
  const auth = useAuth();
  const [schoolId, setSchoolId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  if (auth.status === "authenticated") return <Redirect href="/(app)/home" />;

  const submit = () => {
    if (!schoolId.trim() || !email.trim() || !password) {
      setValidationError("School ID, email, and password are required.");
      return;
    }
    setValidationError(null);
    void auth.signIn({ schoolId, email, password });
  };

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <Screen>
        <PageIntro
          title="JinaCampus"
          subtitle="The Complete School OS, powered by Parshav Insights. Sign in with your School ID, email, and password."
        />
        <Card elevated>
          <Field label="School ID" value={schoolId} onChangeText={setSchoolId} placeholder="school-id" />
          <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="you@school.example" />
          <PasswordField label="Password" value={password} onChangeText={setPassword} placeholder="Password" />
          {validationError ? <Message tone="error">{validationError}</Message> : null}
          {auth.error ? <Message tone="error">{auth.error}</Message> : null}
          <PrimaryButton label="Sign in" onPress={submit} loading={auth.status === "loading"} />
        </Card>
      </Screen>
    </KeyboardAvoidingView>
  );
}
