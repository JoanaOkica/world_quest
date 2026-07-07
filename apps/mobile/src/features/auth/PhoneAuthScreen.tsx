import React, { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { Screen } from "../../components/Screen";
import { Button } from "../../components/Button";
import { colors, font, radius, spacing } from "../../theme";
import { usePhoneAuth } from "./useAuth";

export function PhoneAuthScreen() {
  const { sendOtp, verifyOtp, loading, error } = usePhoneAuth();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);

  async function onSend() {
    if (await sendOtp(phone.trim())) setSent(true);
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={font.h1}>World Quest</Text>
        <Text style={[font.muted, styles.tagline]}>
          Travel greener. Claim more of the map.
        </Text>
      </View>

      {!sent ? (
        <>
          <Text style={styles.label}>Phone number</Text>
          <TextInput
            style={styles.input}
            placeholder="+351 912 345 678"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            autoComplete="tel"
            value={phone}
            onChangeText={setPhone}
          />
          <Button title="Send code" onPress={onSend} loading={loading} />
          <Text style={styles.fineprint}>
            We verify your number by SMS. It's how we keep bots off the leaderboard.
          </Text>
        </>
      ) : (
        <>
          <Text style={styles.label}>Enter the 6-digit code</Text>
          <TextInput
            style={styles.input}
            placeholder="123456"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            autoComplete="sms-otp"
            value={code}
            onChangeText={setCode}
          />
          <Button
            title="Verify & sign in"
            onPress={() => verifyOtp(phone.trim(), code.trim())}
            loading={loading}
          />
          <Button
            title="Use a different number"
            variant="secondary"
            onPress={() => setSent(false)}
            style={{ marginTop: spacing(1) }}
          />
        </>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: spacing(6), marginBottom: spacing(5) },
  tagline: { marginTop: spacing(1) },
  label: { ...font.muted, marginBottom: spacing(1) },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    color: colors.text,
    fontSize: 18,
    padding: spacing(2),
    marginBottom: spacing(2),
  },
  fineprint: { ...font.muted, marginTop: spacing(2) },
  error: { color: colors.danger, marginTop: spacing(2) },
});
