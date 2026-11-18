#!/bin/bash
# 学英语神器 · Android APK 构建脚本
# 目标：华为非鸿蒙系统（EMUI / Android）手机
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
SDK="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
BT="$SDK/build-tools/34.0.0"
JAR="$SDK/platforms/android-34/android.jar"

if [ ! -d "$BT" ]; then
  echo "❌ 找不到 Android build-tools 34.0.0: $BT"
  echo "   请安装: sdkmanager \"build-tools;34.0.0\""
  exit 1
fi
if [ ! -f "$JAR" ]; then
  echo "❌ 找不到 android.jar: $JAR"
  exit 1
fi

# 优先使用 DevEco Studio 自带 JDK
if [ -x "/Applications/DevEco-Studio.app/Contents/jbr/Contents/Home/bin/javac" ]; then
  export JAVA_HOME="/Applications/DevEco-Studio.app/Contents/jbr/Contents/Home"
fi
export PATH="$JAVA_HOME/bin:$PATH"

cd "$ROOT"
rm -rf build
mkdir -p build/classes build/dex build/res dist

echo "🎨 生成图标…"
if python3 -c "import PIL" >/dev/null 2>&1; then
  python3 tools/make_icon.py
else
  echo "   ⚠️ 未安装 Pillow，跳过图标生成（使用 res/ 中已有图标）"
fi

echo "📦 编译资源…"
"$BT/aapt2" compile --dir res -o build/res.zip

echo "🔗 链接 APK…"
"$BT/aapt2" link \
  -o build/base.apk \
  -I "$JAR" \
  --manifest AndroidManifest.xml \
  -R build/res.zip \
  -A web \
  --min-sdk-version 21 \
  --target-sdk-version 34 \
  --version-code 1 \
  --version-name 1.0.0 \
  --auto-add-overlay

echo "☕ 编译 Java…"
javac -source 8 -target 8 -parameters -Xlint:-options \
  -bootclasspath "$JAR" -classpath "$JAR" \
  -d build/classes \
  src/com/henry/englishgenius/MainActivity.java

echo "⚙️ 生成 dex…"
"$BT/d8" --lib "$JAR" --min-api 21 \
  --output build/dex \
  build/classes/com/henry/englishgenius/*.class

echo "🧩 打包 dex…"
(cd build/dex && zip -q -u ../base.apk classes.dex)

echo "📐 对齐…"
"$BT/zipalign" -f 4 build/base.apk build/aligned.apk

KEYSTORE="$ROOT/debug.keystore"
if [ ! -f "$KEYSTORE" ]; then
  echo "🔑 生成调试签名…"
  keytool -genkeypair -v \
    -keystore "$KEYSTORE" \
    -storepass android -alias androiddebugkey -keypass android \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -dname "CN=Android Debug,O=Android,C=US" >/dev/null 2>&1
fi

echo "✍️ 签名…"
"$BT/apksigner" sign \
  --ks "$KEYSTORE" \
  --ks-pass pass:android --key-pass pass:android \
  --out dist/EnglishGenius.apk \
  build/aligned.apk

"$BT/apksigner" verify --verbose dist/EnglishGenius.apk | head -5

SIZE=$(du -h dist/EnglishGenius.apk | cut -f1)
cp dist/EnglishGenius.apk "dist/学英语神器.apk"
echo ""
echo "✅ 构建完成: $ROOT/dist/EnglishGenius.apk ($SIZE)"
echo "   中文副本: $ROOT/dist/学英语神器.apk"
echo "   安装: adb install -r \"$ROOT/dist/EnglishGenius.apk\""
