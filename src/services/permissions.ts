import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Geolocation } from "@capacitor/geolocation";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Capacitor } from "@capacitor/core";

export async function vibrateIfEnabled(enabled: boolean) {
  if (!enabled || !Capacitor.isNativePlatform()) return;
  await Haptics.impact({ style: ImpactStyle.Light }).catch(() => undefined);
}

export async function capturePhotoOnDemand() {
  return Camera.getPhoto({
    quality: 72,
    allowEditing: false,
    resultType: CameraResultType.DataUrl,
    source: CameraSource.Camera
  });
}

export async function requestLocationOnDemand() {
  const permission = await Geolocation.checkPermissions();
  if (permission.location !== "granted") {
    await Geolocation.requestPermissions({ permissions: ["location"] });
  }
  return Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
}

export async function requestMicrophoneOnDemand() {
  const media = await navigator.mediaDevices?.getUserMedia?.({ audio: true });
  media?.getTracks().forEach((track) => track.stop());
}
