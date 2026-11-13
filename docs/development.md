# Development

Setting up a computer, running the app, and getting it onto the phone. Testing: [ADR-005](decisions/005-testing.md).

## Setting up a new computer
1. Install the tools:
   - **Node.js** 22.22+, 24.15+, or 26+ (Angular 22's range).
   - **JDK 21**, with `JAVA_HOME` set.
   - **Android SDK** with platform 36 and build-tools, with `ANDROID_HOME` set and `platform-tools` (for `adb`) on `PATH`. Android Studio installs all of this.
2. In the project folder:
   ```
   npm install
   npx playwright install chromium
   npm run verify
   ```
   `npx playwright install chromium` is needed once per computer: npm doesn't install Playwright's browser. `npm run verify` should pass before you change anything.

## Running the app
- **In a browser:** `npm start`, then open http://localhost:4200. This is a development build, which fills an empty database with sample days.
- **On the phone:** build, then install:
  ```
  npm run build
  npx cap run android
  ```
  Pick the phone when asked. `npm run build` is a production build, which starts with an empty database; for the sample days, build with `npx ng build --configuration development` instead.

  **`npx cap sync android` does not install anything.** It only copies the build into the Android project. Installing takes `npx cap run android`, or Run in Android Studio.

## Checking what's on the phone
Before testing a change on the phone, confirm the phone has the current build.

1. **Is the phone connected?** `adb devices` should list it as `device`.
   - Not listed at all: on the phone, set the USB mode to **File transfer** (tap the USB notification), and try another cable or port. Many cables only charge.
   - Listed as `unauthorized`: unlock the phone and accept the **Allow USB debugging?** prompt.
2. **Which build is installed?**
   ```
   adb shell dumpsys package dev.gabe.fitnesstracker | grep lastUpdateTime
   ```
   If that's older than your last change, the phone has an old build. Install again.

## Installing from a different computer
Each computer signs debug builds with its own key (`%USERPROFILE%\.android\debug.keystore`). If the phone's copy was installed from another computer, installing fails with:

```
INSTALL_FAILED_UPDATE_INCOMPATIBLE: Existing package dev.gabe.fitnesstracker signatures do not match
```

- **Fix:** uninstall the app from the phone, then install again.
- **Uninstalling deletes the app's on-device data.** Until there's real data in the app that doesn't matter. Once there is, make a JSON export first ([SPEC.md §7](SPEC.md#7-data-and-units)): it's the only backup until sync exists.
- **To avoid it:** copy `debug.keystore` from the computer that installed the phone's copy to the same place on the others, so every computer signs with the same key. Copy it by hand; don't commit it (`.gitignore` excludes keystores).
