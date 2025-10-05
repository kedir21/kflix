

## Generating Android app icons

If you want to update the Android launcher icon, place your source image(s) into `resources/android/`:
- Single icon (legacy): `resources/android/icon.png` (1024x1024 PNG)
- Adaptive icon (recommended): `resources/android/foreground.png` and `resources/android/background.png`

Then run:

```bash
# install generator once
npm install -D cordova-res

# generate icons and copy into android resources
npm run icons:android
# or use the helper script
scripts/generate-icons.sh

# sync native project and open Android Studio
npx cap sync android
npx cap open android
```

After opening in Android Studio, rebuild and run on a device/emulator to confirm the new icon.
