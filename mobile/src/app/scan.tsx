import Ionicons from "@expo/vector-icons/Ionicons";
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppText, Button, Card, Screen, SectionTitle } from "@/components/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { parseBusSticker } from "@/lib/qr";
import { accents, radiusLarge, spacing } from "@/theme/colors";

/** Scans the TransitX sticker inside a bus and opens the report form for that bus. */
export default function ScanScreen() {
  const { t } = useI18n();
  const [permission, requestPermission] = useCameraPermissions();
  const [wrongCode, setWrongCode] = useState(false);
  const handled = useRef(false);

  const onScanned = ({ data }: BarcodeScanningResult) => {
    if (handled.current) return;
    const sticker = parseBusSticker(data);
    if (!sticker) {
      setWrongCode(true);
      return;
    }
    handled.current = true;
    router.replace({
      pathname: "/report",
      params: { bus: sticker.bus, route: sticker.route, src: "qr" },
    });
  };

  if (!permission?.granted) {
    return (
      <Screen>
        <Card>
          <SectionTitle icon="camera" color={accents.violet}>
            {t("app.scanTitle")}
          </SectionTitle>
          <AppText variant="secondary">{t("app.scanHint")}</AppText>
          {permission && !permission.canAskAgain && (
            <AppText style={{ color: accents.amber }}>{t("app.cameraDenied")}</AppText>
          )}
          <Button
            icon="camera"
            label={t("app.allowCamera")}
            onPress={() => void requestPermission()}
            disabled={permission ? !permission.canAskAgain : false}
          />
        </Card>
      </Screen>
    );
  }

  return (
    <View style={styles.fill}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={onScanned}
      />
      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.frame} />
        <View style={styles.hint}>
          <Ionicons name="qr-code" size={20} color="#FFFFFF" />
          <Text style={styles.hintText}>
            {wrongCode ? t("app.scanInvalid") : t("app.scanHint")}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#000000" },
  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  frame: {
    width: 250,
    height: 250,
    borderRadius: radiusLarge,
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  hint: {
    position: "absolute",
    bottom: 64,
    marginHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  hintText: { color: "#FFFFFF", fontSize: 15, fontWeight: "600", flexShrink: 1 },
});
