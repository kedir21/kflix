Place your source icon(s) here and run the helper script or npm script to generate Android launcher icons.

Recommended files:
- For a legacy single-icon approach: `icon.png` (1024x1024 PNG)
- For adaptive icons (preferred): `foreground.png` (subject with transparency) and `background.png` (solid background, or `background.png` can be a 1x1 color PNG)

Commands:
- Install the generator (once):
  npm install -D cordova-res

- Generate and copy icons into the Android project:
  npm run icons:android

After running, sync native and build:
  npx cap sync android
  npx cap open android

Then build/run from Android Studio.
