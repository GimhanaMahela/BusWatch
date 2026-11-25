import * as ImagePicker from "expo-image-picker";
import { Alert, Image, Pressable, StyleSheet, View } from "react-native";

import { AppText, Button } from "@/components/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { MAX_PHOTO_BYTES, MAX_PHOTOS, type Photo } from "@/lib/reportDraft";
import { radius, spacing } from "@/theme/colors";
import { useTheme } from "@/theme/useTheme";

const MB = Math.round(MAX_PHOTO_BYTES / (1024 * 1024));

const toPhoto = (asset: ImagePicker.ImagePickerAsset, index: number): Photo => ({
  uri: asset.uri,
  name: asset.fileName ?? `photo-${Date.now()}-${index}.jpg`,
  mimeType: asset.mimeType ?? "image/jpeg",
  size: asset.fileSize,
});

export function PhotoPicker({
  photos,
  onChange,
}: {
  photos: Photo[];
  onChange: (photos: Photo[]) => void;
}) {
  const { t } = useI18n();
  const theme = useTheme();
  const remaining = MAX_PHOTOS - photos.length;

  const add = (assets: ImagePicker.ImagePickerAsset[]) => {
    const picked = assets.map(toPhoto);
    const tooBig = picked.filter((photo) => (photo.size ?? 0) > MAX_PHOTO_BYTES);
    if (tooBig.length > 0) {
      Alert.alert(
        t("media.tooBig", {
          count: tooBig.length,
          names: tooBig.map((photo) => photo.name).join(", "),
          mb: MB,
        }),
      );
    }
    const fitting = picked.filter((photo) => !tooBig.includes(photo)).slice(0, remaining);
    if (fitting.length > 0) onChange([...photos, ...fitting]);
  };

  // Photos are re-encoded at 0.7 quality: well under the size limit, still clear as evidence
  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.7 });
    if (!result.canceled) add(result.assets);
  };

  const choosePhotos = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.7,
    });
    if (!result.canceled) add(result.assets);
  };

  return (
    <View style={styles.wrap}>
      {photos.length > 0 && (
        <View style={styles.thumbs}>
          {photos.map((photo) => (
            <Pressable
              key={photo.uri}
              accessibilityRole="button"
              accessibilityLabel={t("media.remove", { name: photo.name })}
              onPress={() => onChange(photos.filter((other) => other !== photo))}
            >
              <Image source={{ uri: photo.uri }} style={styles.thumb} />
              <View style={[styles.remove, { backgroundColor: theme.text }]}>
                <AppText style={{ color: theme.surface, fontSize: 14, lineHeight: 18 }}>✕</AppText>
              </View>
            </Pressable>
          ))}
        </View>
      )}
      {remaining > 0 ? (
        <View style={styles.buttons}>
          <View style={styles.grow}>
            <Button
              variant="outline"
              icon="camera-outline"
              label={t("app.takePhoto")}
              onPress={() => void takePhoto()}
            />
          </View>
          <View style={styles.grow}>
            <Button
              variant="outline"
              icon="images-outline"
              label={t("media.addPhotos")}
              onPress={() => void choosePhotos()}
            />
          </View>
        </View>
      ) : (
        <AppText variant="secondary">{t("media.limitReached", { max: MAX_PHOTOS })}</AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  thumbs: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  thumb: { width: 92, height: 92, borderRadius: radius },
  remove: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.8,
  },
  buttons: { flexDirection: "row", gap: spacing.sm },
  grow: { flex: 1 },
});
