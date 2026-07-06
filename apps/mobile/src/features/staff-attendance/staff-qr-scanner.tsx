import { useCallback, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera";
import { Text, TextInput, View } from "react-native";
import { ApiError, scanStaffAttendanceQr } from "../../api/client";
import { Card, DetailRow, Message, PrimaryButton, SecondaryButton, StatusBadge } from "../../components/ui";
import { colors, radius, spacing } from "../../lib/theme";
import { parseStaffAttendanceQrPayload } from "./qr-payload";
import type { StaffQrScanResponse } from "../../api/contracts";

function safeScanError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === "MOBILE_API_PENDING") return "Scanner is ready. Backend mobile scan API is pending.";
    if (error.status === 401) return "Your session has expired. Please sign in again.";
    return error.message;
  }
  return "Unable to submit the QR scan. Please try again.";
}

export function StaffQrScanner({ sessionToken }: { sessionToken: string | null }) {
  const queryClient = useQueryClient();
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [manualValue, setManualValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StaffQrScanResponse | null>(null);
  const scanLockedRef = useRef(false);

  const submitToken = useCallback(async (token: string) => {
    if (!sessionToken) {
      setError("Please sign in again before scanning.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const response = await scanStaffAttendanceQr(sessionToken, token);
      setResult(response);
      setManualValue("");
      setCameraOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["my-staff-attendance-status"] });
    } catch (scanError) {
      setError(safeScanError(scanError));
    } finally {
      scanLockedRef.current = false;
      setSubmitting(false);
    }
  }, [queryClient, sessionToken]);

  const submitPayload = useCallback((payload: string) => {
    const parsed = parseStaffAttendanceQrPayload(payload);
    if (!parsed.ok) {
      setError(parsed.error);
      setResult(null);
      return;
    }
    void submitToken(parsed.token);
  }, [submitToken]);

  const handleBarcodeScanned = useCallback((scan: BarcodeScanningResult) => {
    if (scanLockedRef.current) return;
    scanLockedRef.current = true;
    submitPayload(scan.data);
  }, [submitPayload]);

  const startCamera = useCallback(async () => {
    setError(null);
    if (!permission?.granted) {
      const response = await requestPermission();
      if (!response.granted) {
        setError("Camera access is needed to scan the QR code. You can use manual token entry instead.");
        return;
      }
    }
    scanLockedRef.current = false;
    setCameraOpen(true);
  }, [permission?.granted, requestPermission]);

  return (
    <View style={{ gap: spacing.md }}>
      <Card elevated>
        <StatusBadge label="Online scanner" tone="info" />
        <Text selectable style={{ color: colors.text, fontSize: 18, fontWeight: "800" }}>
          Camera Scanner
        </Text>
        <Text selectable style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>
          Allow camera access and point your phone at the JinaCampus staff attendance QR code.
        </Text>
        {cameraOpen ? (
          <View style={{ gap: spacing.sm }}>
            <View style={{ overflow: "hidden", borderRadius: radius.xl, minHeight: 320, backgroundColor: colors.text }}>
              <CameraView
                style={{ flex: 1, minHeight: 320 }}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                onBarcodeScanned={submitting ? undefined : handleBarcodeScanned}
              />
            </View>
            <SecondaryButton label="Stop Camera" onPress={() => setCameraOpen(false)} />
          </View>
        ) : (
          <PrimaryButton label="Start Camera" onPress={startCamera} disabled={submitting} loading={submitting} />
        )}
      </Card>

      <Card>
        <StatusBadge label="Fallback" tone="warning" />
        <Text selectable style={{ color: colors.text, fontSize: 18, fontWeight: "800" }}>
          Manual Token Entry
        </Text>
        <Text selectable style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>
          Use this fallback if camera permission is denied or the camera cannot read the QR code.
        </Text>
        <TextInput
          value={manualValue}
          onChangeText={setManualValue}
          accessibilityLabel="Manual QR token"
          placeholder="Paste QR token or STAFF_ATTENDANCE_QR payload"
          autoCapitalize="none"
          style={{
            minHeight: 96,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.border,
            color: colors.text,
            backgroundColor: colors.surfaceGlass,
            padding: spacing.md,
            textAlignVertical: "top"
          }}
          placeholderTextColor={colors.muted}
          multiline
        />
        <PrimaryButton label="Submit Manual Token" onPress={() => submitPayload(manualValue)} disabled={submitting} loading={submitting} />
      </Card>

      {error ? <Message tone="error">{error}</Message> : null}

      {result ? (
        <Card elevated>
          <Message tone="success">{result.message || "Attendance scan recorded."}</Message>
          <StatusBadge label={result.purpose} tone="success" />
          <DetailRow label="Purpose" value={result.purpose} />
          <DetailRow label="Attendance date" value={result.attendanceDate} />
          <DetailRow label="Status" value={result.status} />
          <DetailRow label="Check-in" value={result.checkInAt ?? "Not recorded"} />
          <DetailRow label="Check-out" value={result.checkOutAt ?? "Not recorded"} />
          <DetailRow label="Working minutes" value={result.workingMinutes ?? "Not available"} />
        </Card>
      ) : null}
    </View>
  );
}
