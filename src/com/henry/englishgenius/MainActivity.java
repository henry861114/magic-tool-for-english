package com.henry.englishgenius;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.graphics.Color;
import android.media.MediaPlayer;
import android.media.MediaRecorder;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.DisplayMetrics;
import android.util.Log;
import android.speech.tts.TextToSpeech;
import android.view.View;
import android.view.Window;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;


import org.json.JSONObject;

import java.io.File;
import java.util.ArrayList;
import java.util.Locale;

public class MainActivity extends Activity {

    private static final String TAG = "EnglishGenius";
    private static final int REQ_AUDIO = 21;

    private WebView webView;
    private TextToSpeech tts;
    private boolean ttsReady = false;
    private String pendingSpeech = null;
    private String pendingAccent = "us";
    private float pendingRate = 0.9f;


    private MediaRecorder recorder = null;
    private File recordFile = null;
    private MediaPlayer player = null;
    private long lastRmsEmit = 0;
    private boolean levelPolling = false;

    private final Handler main = new Handler(Looper.getMainLooper());

    private final Runnable levelPoller = new Runnable() {
        @Override
        public void run() {
            if (recorder != null) {
                try {
                    int amp = recorder.getMaxAmplitude();
                    int pct = (int) Math.min(100, Math.max(0, amp / 320));
                    emit("window.EG&&EG.onMicLevel(" + pct + ")");
                } catch (Throwable ignored) { }
                main.postDelayed(this, 120);
            } else {
                levelPolling = false;
            }
        }
    };

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window w = getWindow();
        w.setStatusBarColor(Color.parseColor("#F2913D"));
        w.setNavigationBarColor(Color.parseColor("#FFFDFA"));
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            w.getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
        }

        webView = new WebView(this);
        webView.setBackgroundColor(Color.parseColor("#FDF8F2"));
        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setTextZoom(100);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());
        webView.addJavascriptInterface(new Bridge(), "AndroidBridge");
        setContentView(webView);
        webView.loadUrl("file:///android_asset/index.html");

        initTts();
    }

    /* ---------------- TTS ---------------- */
    private void initTts() {
        tts = new TextToSpeech(this, new TextToSpeech.OnInitListener() {
            @Override
            public void onInit(int status) {
                if (status == TextToSpeech.SUCCESS) {
                    ttsReady = true;
                    try {
                        tts.setLanguage(Locale.US);
                        tts.setPitch(1.0f);
                    } catch (Throwable ignored) { }
                    if (pendingSpeech != null) {
                        String text = pendingSpeech;
                        pendingSpeech = null;
                        doSpeak(text, pendingAccent, pendingRate);
                    }
                } else {
                    emit("window.EG&&EG.onTtsError('init')");
                }
            }
        });
    }

    private void doSpeak(String text, String accent, float rate) {
        if (text == null || text.trim().length() == 0) return;
        if (tts == null) return;
        if (!ttsReady) {
            pendingSpeech = text;
            pendingAccent = accent;
            pendingRate = rate;
            return;
        }
        String lang = "uk".equals(accent) ? "en-GB" : "en-US";
        try {
            int avail = tts.setLanguage(Locale.forLanguageTag(lang));
            if (avail == TextToSpeech.LANG_MISSING_DATA || avail == TextToSpeech.LANG_NOT_SUPPORTED) {
                // 英音语音包缺失时自动回退美音
                avail = tts.setLanguage(Locale.US);
            }
            if (avail == TextToSpeech.LANG_MISSING_DATA || avail == TextToSpeech.LANG_NOT_SUPPORTED) {
                emit("window.EG&&EG.onTtsError('missing')");
                return;
            }
            float r = Math.max(0.4f, Math.min(1.6f, rate <= 0 ? 0.9f : rate));
            tts.setSpeechRate(r);
            tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "eg_utterance");
        } catch (Throwable ignored) { }
    }

    /* ---------------- 录音 ---------------- */
    private boolean hasAudioPermission() {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.M
                || checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED;
    }

    private boolean startRecordInternal() {
        try {
            stopPlaybackInternal();
            stopRecordInternal();
            File dir = getCacheDir();
            recordFile = new File(dir, "eg_pronunciation.m4a");
            if (recordFile.exists() && !recordFile.delete()) {
                // 继续尝试写入，最坏情况会被覆盖
            }
            recorder = new MediaRecorder();
            recorder.setAudioSource(MediaRecorder.AudioSource.MIC);
            recorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4);
            recorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC);
            recorder.setAudioSamplingRate(44100);
            recorder.setAudioEncodingBitRate(96000);
            recorder.setOutputFile(recordFile.getAbsolutePath());
            recorder.prepare();
            recorder.start();
            if (!levelPolling) {
                levelPolling = true;
                main.post(levelPoller);
            }
            return true;
        } catch (Throwable t) {
            try { if (recorder != null) recorder.release(); } catch (Throwable ignored) { }
            recorder = null;
            return false;
        }
    }

    private void stopRecordInternal() {
        if (recorder != null) {
            try { recorder.stop(); } catch (Throwable ignored) { }
            try { recorder.release(); } catch (Throwable ignored) { }
            recorder = null;
        }
    }

    private void playRecordInternal() {
        try {
            if (recordFile == null || !recordFile.exists() || recordFile.length() <= 0) {
                emit("window.EG&&EG.onRecordState('noplay')");
                return;
            }
            stopPlaybackInternal();
            player = new MediaPlayer();
            player.setDataSource(recordFile.getAbsolutePath());
            player.setOnCompletionListener(new MediaPlayer.OnCompletionListener() {
                @Override
                public void onCompletion(MediaPlayer mp) {
                    emit("window.EG&&EG.onRecordState('playend')");
                }
            });
            player.prepare();
            player.start();
        } catch (Throwable t) {
            stopPlaybackInternal();
            emit("window.EG&&EG.onRecordState('noplay')");
        }
    }

    private void stopPlaybackInternal() {
        if (player != null) {
            try { player.stop(); } catch (Throwable ignored) { }
            try { player.release(); } catch (Throwable ignored) { }
            player = null;
        }
    }

    /* ---------------- JS 桥 ---------------- */
    private void emit(final String js) {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try { webView.evaluateJavascript(js, null); } catch (Throwable ignored) { }
            }
        });
    }

    private void toastOnUiThread(final String msg) {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try { Toast.makeText(MainActivity.this, msg, Toast.LENGTH_SHORT).show(); } catch (Throwable ignored) { }
            }
        });
    }

    public class Bridge {
        @JavascriptInterface
        public boolean isNative() { return true; }

        /**
         * Physical display + density information, so the web layer can pick
         * the right layout before painting.  widthDp/heightDp are the CSS
         * (device-independent) pixels the WebView will actually use.
         */
        @JavascriptInterface
        public String getScreenInfo() {
            try {
                DisplayMetrics dm = new DisplayMetrics();
                try {
                    getWindowManager().getDefaultDisplay().getRealMetrics(dm);
                } catch (Throwable t) {
                    dm = getResources().getDisplayMetrics();
                }
                Configuration cfg = getResources().getConfiguration();
                int wPx = dm.widthPixels;
                int hPx = dm.heightPixels;
                float density = dm.density > 0 ? dm.density : 1f;
                JSONObject o = new JSONObject();
                o.put("widthPx", wPx);
                o.put("heightPx", hPx);
                o.put("longEdgePx", Math.max(wPx, hPx));
                o.put("shortEdgePx", Math.min(wPx, hPx));
                o.put("density", (double) density);
                o.put("densityDpi", dm.densityDpi);
                o.put("widthDp", Math.round(wPx / density));
                o.put("heightDp", Math.round(hPx / density));
                o.put("smallestWidthDp", cfg.smallestScreenWidthDp);
                o.put("orientation",
                        cfg.orientation == Configuration.ORIENTATION_LANDSCAPE ? "landscape" : "portrait");
                o.put("sdk", Build.VERSION.SDK_INT);
                return o.toString();
            } catch (Throwable t) {
                return "{}";
            }
        }

        @JavascriptInterface
        public boolean hasRecordPermission() { return hasAudioPermission(); }

        @JavascriptInterface
        public boolean isTtsReady() { return ttsReady; }

        @JavascriptInterface
        public void speak(final String text, final String accent, final float rate) {
            main.post(new Runnable() {
                @Override
                public void run() {
                    if (tts == null) { initTts(); pendingSpeech = text; pendingAccent = accent; pendingRate = rate; return; }
                    doSpeak(text, accent, rate);
                }
            });
        }

        @JavascriptInterface
        public void stopSpeak() {
            main.post(new Runnable() {
                @Override
                public void run() {
                    try { if (tts != null) tts.stop(); } catch (Throwable ignored) { }
                }
            });
        }

        @JavascriptInterface
        public boolean startRecording() {
            if (!hasAudioPermission()) {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, REQ_AUDIO);
                    }
                });
                return false;
            }
            main.post(new Runnable() {
                @Override
                public void run() {
                    boolean ok = startRecordInternal();
                    emit("window.EG&&EG.onRecordState('" + (ok ? "started" : "error") + "')");
                }
            });
            return true;
        }

        @JavascriptInterface
        public void stopRecording() {
            main.post(new Runnable() {
                @Override
                public void run() {
                    stopRecordInternal();
                    emit("window.EG&&EG.onRecordState('stopped')");
                }
            });
        }

        @JavascriptInterface
        public void playRecording() {
            main.post(new Runnable() {
                @Override
                public void run() { playRecordInternal(); }
            });
        }

        @JavascriptInterface
        public void stopPlayback() {
            main.post(new Runnable() {
                @Override
                public void run() { stopPlaybackInternal(); }
            });
        }

        @JavascriptInterface
        public void vibrate(final int ms) {
            try {
                android.os.Vibrator v = (android.os.Vibrator) getSystemService(VIBRATOR_SERVICE);
                if (v != null) v.vibrate(Math.max(10, Math.min(200, ms)));
            } catch (Throwable ignored) { }
        }

        @JavascriptInterface
        public void finishApp() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() { finish(); }
            });
        }
    }

    /* ---------------- 生命周期 ---------------- */
    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQ_AUDIO) {
            boolean granted = grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED;
            emit("window.EG&&EG.onPermission(" + granted + ")");
            if (granted) {
                toastOnUiThread("麦克风已开启");
            }
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null) {
            webView.evaluateJavascript("window.EG&&EG.handleBack?EG.handleBack():0", null);
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        try { if (tts != null) tts.stop(); } catch (Throwable ignored) { }
        stopPlaybackInternal();
        stopRecordInternal();
    }

    @Override
    protected void onDestroy() {
        try { if (tts != null) { tts.stop(); tts.shutdown(); } } catch (Throwable ignored) { }
        stopPlaybackInternal();
        stopRecordInternal();
        if (webView != null) {
            try { webView.destroy(); } catch (Throwable ignored) { }
        }
        super.onDestroy();
    }
}
