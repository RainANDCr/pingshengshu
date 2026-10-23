# 平生述 · Android APK 打包指引

> 说明：APK 需在本机安装 Android Studio（含 Android SDK + JDK 17）后构建。
> 本目录（`android/`）是 Capacitor 的 Web 工程根，`www/index.html` 已放置最新内核，
> 运行下面命令会自动生成 `android/android/` 原生工程并产出 APK。

## 一、环境准备（一次性）

1. 安装 [Android Studio](https://developer.android.com/studio)（默认会带上 Android SDK）。
2. 确认 JDK 17：Android Studio 自带 JBR 17，或用 `JAVA_HOME` 指向 JDK 17。
3. 在 Android Studio 的 SDK Manager 中安装一个 Android Platform（如 API 34）与 Build-Tools。

## 二、一键打包

在项目根目录 `平生述/` 打开终端（PowerShell 或 CMD），执行：

```bat
cd android
npm install
npx cap add android
npx cap sync
cd android
gradlew.bat assembleDebug
```

若 `gradlew` 未在 PATH，直接用完整路径：

```bat
cd android
.\gradlew.bat assembleDebug
```

## 三、产物位置

```
android/android/app/build/outputs/apk/debug/app-debug.apk
```

用数据线连接手机（开启 USB 调试）后安装：

```bat
adb install -r android/android/app/build/outputs/apk/debug/app-debug.apk
```

## 四、生成签名发布包（上架用）

```bat
keytool -genkey -v -keystore pingshengshu.keystore -alias pingshengshu -keyalg RSA -keysize 2048 -validity 10000
```

在 `android/android/app/build.gradle` 中配置 `signingConfigs` 后：

```bat
gradlew.bat assembleRelease
```

## 五、常见问题

- **修改了网页内核后**：需重新 `copy ..\..\index.html www\index.html` 再 `npx cap sync`。
- **录音不可用**：APK 首次使用需授权麦克风权限；WebView 需较新版本。
- **JDK 版本报错**：Capacitor 6 / AGP 8 要求 JDK 17，请勿使用 JDK 25。
