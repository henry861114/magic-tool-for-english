# 学英语神器 · Android APK

面向 **华为非鸿蒙系统（EMUI / Android）** 的自然拼读记单词应用。安装后无需联网即可学习，内置小学三年级至初中九年级 **91 个单元、2983 个单词**，覆盖人教版 PEP/人教英语各册上、下册；其中五年级严格对齐 **2026 秋人教版 PEP 五年级上册 Unit 1–6**。

> 目标机型：华为 Mate 70 Pro（PLR-AL00，HarmonyOS 4.3 / Android 12 底层）
> 安装包：`dist/EnglishGenius.apk`（中文副本 `dist/学英语神器.apk`）

---

## 一、需求对照

| 要求 | 实现 |
| --- | --- |
| 按小学、中学课文要求，按年级学习 | 首页提供 **全部 / 三～九年级** 年级筛选和 **全部 / 上册 / 下册** 册次筛选；91 个单元按年级、册次、课本 Unit 顺序分组 |
| 支持单独巩固知识库 | 底部「巩固」页提供 **独立知识库**：跨年级自由选词、按年级筛选、全选 / 错词 / 收藏、随机 10 词，进入闪卡式巩固训练，与年级课程进度互不影响 |
| 单个音素发音 | 内置 66 个独立 IPA 音素音频（用户提供的 48 音标课程同一位老师，22,050 Hz），裁掉教学尾音 schwa；点「音素」按当前单词逐音朗读；点音块播放**整块合成音频**（如 ence 读 /əns/，不再拆成 ə-n-s）；拆拼点字母读该字母在单词中的音 |
| 四步学习法 | 学 → 练 → 拆拼 → 写；拆和拼合并为自动单字母拆分、随机打乱后重组 |
| 华为非鸿蒙系统 | 原生 Android APK（minSdk 21 / targetSdk 34），不依赖 Google 服务，可直接安装到 EMUI 手机 |
| 手机 / 平板 / 横屏 | 启动时先读取 Android 原生 `DisplayMetrics`（物理像素 + 密度），换算成 WebView 逻辑像素后选择布局，并在「我的」页显示检测结果；宽度 ≥720px 铺满屏宽，≥1024/1280/1600/1900px 分别为 4/5/6/7 列，覆盖 1920×1200、2160×1440、2560×1600 等常见分辨率；支持横竖屏旋转，横屏矮屏自动收紧顶部/底部 |

---

## 二、核心功能

### 1. 按年级学习（三～九年级）

| 年级 | 册次 | 单元数 | 单词数 | 说明 |
| --- | --- | ---: | ---: | --- |
| 三年级 | 上册 + 下册 | 12 | 219 | 2024/2025 新人教版 PEP |
| 四年级 | 上册 + 下册 | 12 | 228 | 2025/2026 新人教版 PEP |
| 五年级 | 上册 + 下册 | 12 | 248 | 上册为 2026 PEP Unit 1–6 |
| 六年级 | 上册 + 下册 | 10 | 209 | 2026 新六上 + 现六下 |
| 七年级 | 上册 + 下册 | 15 | 655 | 2024/2025 新人教 |
| 八年级 | 上册 + 下册 | 16 | 900 | 2025/2026 新人教 |
| 九年级 | 全册 | 14 | 524 | 2026 新九上 + 现行九下 |
| **合计** |  | **91** | **2983** |  |

- 首页年级筛选会记住上次选择；单元卡片显示所属年级、完成进度。
- 学习页顶部有本单元单词横向导航，可随时跳到任意单词。
- 每个单词独立保存四步完成状态、收藏、答对/答错次数。

### 2. 四步记单词

1. **学**：字母块按元音/辅音分色，点击听音；音标、中文释义、插图；支持收藏。
2. **练**：随机生成「看词选义 / 听音选词 / 补全字母组合」选择题，答对得星星，答错自动进入错词本。
3. **拆拼**：进入后自动把单词拆成单个字母并随机打乱；按正确顺序点击字母拼回单词，错误抖动并重新打乱。
4. **写**：四线三格手写区域，支持华为 M-Pencil / 手指书写；可切换键盘输入；写完点「提交」后显示标准拼写，由孩子手动对照确认，完成即计入已掌握。

完成「写」后获得星星、计入当日目标，并触发撒花庆祝。

### 3. 独立知识库「巩固」

- **自由选词**：跨年级勾选任意单词，不受课程单元限制。
- **快捷选词**：全选本年级、只选错词、只选收藏、清空。
- **随机 10 词**：从当前年级范围随机抽取，立刻开始。
- **闪卡训练**：先回忆 → 显示释义/例句/自然拼读音节 → 选择「还不熟 / 记住了」。
- 「还不熟」的单词会在本轮末尾追加复习；结束后显示正确率、记住/待巩固数量和获得星星。
- 可针对不熟的词「再练一轮」，或返回知识库重新选词。

### 4. 复习与统计

- **错词本**：练习中答错、巩固时标记不熟的单词自动收集，可直接跳回「练一练」。
- **收藏**：学习页星标收藏的单词集中复习。
- **已掌握**：完成「写一写」的单词。
- 首页展示星星、连续学习天数、已掌握数量、今日目标进度环。
- 设置页支持美音/英音、朗读语速、自动朗读、每日目标（5/10/15/20）、重置进度。

---

## 三、语音说明

| 功能 | 实现方式 | 华为设备表现 |
| --- | --- | --- |
| 单词朗读 | 内置高清晰度离线语音（Samantha），文件缺失时回退系统 TTS | 不依赖华为系统 TTS 的英文质量 |


| 音效/撒花 | Web Audio + DOM 动画 | 无网络依赖 |

当前版本已按需求移除“读”章节，不再使用麦克风跟读；单词、音标与音块均使用本地发音/系统 TTS 播放。

---

## 四、安装

```bash
./build.sh             # 构建 APK
adb install -r dist/EnglishGenius.apk
adb shell am start -n com.henry.englishgenius/.MainActivity
```

也可以在手机上直接打开 APK 安装；华为手机首次安装会提示「继续安装」，确认即可。

## 五、重新构建

需要：

- Android SDK Platform 34：`platforms;android-34`
- Build-Tools 34.0.0：`build-tools;34.0.0`
- JDK 17+（本机使用 DevEco Studio 自带 JBR 21）
- Python 3 + Pillow（可选，仅在需要重新生成图标时使用；`res/` 已内置图标）

```bash
cd app
./build.sh
```

脚本会自动生成图标、编译资源、编译 Java、生成 dex、zipalign、签名，并输出：

```
dist/EnglishGenius.apk
dist/学英语神器.apk
```

> 构建提示：JDK 21 编译内部类时默认带 `MethodParameters`，旧版 d8 会因空参数名崩溃；脚本已通过 `javac -parameters` 规避。

---

## 六、目录结构

```
app/
├── web/                      # 应用界面（离线 WebView）
│   ├── index.html
│   └── assets/
│       ├── app.css           # 视觉样式
│       ├── app.js            # 交互、四步学习、知识库、发音
│       ├── data.js           # 年级课程词库（挂载 PEP_ALL_UNITS）
│       ├── pep_all.js        # 91 个单元 / 2983 词
│       ├── audio/            # 本地单词发音
│       ├── phonics/          # 66 个独立 IPA 音素音频（48 音标课程女声 + 同源变体）
│       └── img/pep/          # 各册单词本地配图
├── src/com/henry/englishgenius/
│   └── MainActivity.java     # WebView 宿主 + TTS / 音频播放桥
├── res/                      # 图标与主题
├── tools/
│   ├── make_icon.py          # 生成启动图标
│   └── cdp_test.py           # 本地自动化验收脚本（开发用）
├── AndroidManifest.xml
├── build.sh
└── dist/
    ├── EnglishGenius.apk
    └── 学英语神器.apk
```

---

## 七、开发预览与验收

浏览器预览：

```bash
cd app/web
python3 -m http.server 8000
# 打开 http://localhost:8000
```

浏览器中可用 `speechSynthesis` 做发音预览；APK 内优先使用本地音频，缺失时回退系统 TTS。

调试直达参数（仅开发用）：

```
index.html?screen=learn&unit=0&word=6&step=0
index.html?screen=consolidate
index.html?screen=drill
```

自动化验收（Chrome headless + CDP）：

```bash
python3 tools/cdp_test.py              # 主流程（年级筛选 → 学练拆拼写 → 巩固）
python3 tools/check_phonics_course.py   # 66 个音素文件 + 2983 词逐音序列
python3 tools/cdp_phonics_test.py      # 28 个代表词的音素播放顺序
python3 tools/cdp_scene_test.py        # 拆拼字母 / 音块场景发音
python3 tools/cdp_chunk_test.py        # 多字母音块整段播放 + 字母拆分
python3 tools/cdp_layout_test.py       # 手机/平板/1920×1200/2560×1600 + 横屏布局
python3 tools/cdp_screen_test.py       # 读取物理分辨率/密度并选择布局（1920/2160）
python3 tools/audit_chunks.py           # 导出 dist/chunk_audit.csv（每个音块的逐字母映射）
python3 tools/cdp_write_manual_test.py # 写一写：提交后手动对照答案
python3 tools/cdp_drill_test.py        # 知识库喇叭 + 巩固训练 WORD_INDEX
```

覆盖：年级筛选、进入单元、练一练答题、自动单字母拆拼、手写后手动确认答案、键盘写词、完成单词、知识库选词、巩固训练、总结页、复习已掌握；音素侧额外覆盖 r 化音块拆分（very / different / library / eraser）、tr/dr/ts/dz 合并、词尾变体、ence 等整块音块与逐字母拆分、同拼写不同读音的字母映射（`le` 在 apple /əl/ 与 mile /l/ 中位置不同）。

---

## 八、说明与边界

- 全年级词表按当前人教版 PEP/人教英语各册单词表整理，五年级单元严格对齐 **2026 秋人教版 PEP 五年级上册**（[电子课本目录](http://www.dzkbw.com/books/rjb/yingyu/pep5s_2026/)）：Unit 1 Different friends、Unit 2 My feelings、Unit 3 Work and play、Unit 4 Healthy habits、Unit 5 Food we eat、Unit 6 Nature and us。带空格的短语暂不进入四步拼写流程，其余单词全部收录。
- 单词与例句音频、五年级单词配图均为本地资源（`web/assets/audio`、`web/assets/img/pep5`），离线可用。
- 手写功能用于描红/自练，不做 OCR 识别，也不做语音识别。写完点「提交」会显示标准拼写、音标和中文，由孩子自己对照确认「我写对了」或「再写一次」；键盘输入仍是精确校验方式。
- 当前版本已移除“读”章节与麦克风跟读，保留单词/音标/音块发音。
- 单词音标以 **CMUdict**（Carnegie Mellon Pronouncing Dictionary，BSD 风格许可）为准重新标注，保留重音并区分 `/ʌ/` 与 `/ə/`、`/ɜːr/` 与 `/ər/`；重音词（read / live / close / use 等）和教材专有词使用人工覆盖。逐块音标由单词音标对齐生成，不再使用旧的自动拆分结果。相关脚本：`tools/fix_ipa_cmudict.py`、`tools/fix_chunk_ipa.py`；词典文件：`tools/cmudict.dict`。
- 五年级（2026 PEP 五上、五下）已逐词复核：修正 subject、hard-working、magazine、August、July、usually、January、excited、habit、artist、palace、even、inside、sometimes、Hawaii、Australia 等易错词；星期统一为教材的 `-deɪ` 结尾（Monday /ˈmʌndeɪ/、Tuesday /ˈtuːzdeɪ/、Wednesday /ˈwenzdeɪ/ 等）。
- 音标规则同时覆盖常见教材拼读：`-ed` 在 t/d 后读 `/ɪd/`（excited、wanted），`-es` 在咝音后读 `/ɪz/`（glasses、boxes），`-ist` 读 `/ɪst/`（artist、dentist），`-age/-ege/-idge` 读 `/ɪdʒ/`（village、college、knowledge），`-ace/-ice/-ise` 读 `/ɪs/`（palace、office、promise）；`-ology/-igence` 等仍保留 `/ə/`。
- 单个音素音频位于 `web/assets/phonics/`，共 **66 个 WAV**，来自用户提供的「48个国际音标 24天打卡」课程（PDF 分类表 + 48 个 DayX-1/DayX-2 MP3）：48 个基础音（12 单元音、8 双元音、28 辅音，含 `tr` `dr` `ts` `dz`）+ 8 个同套例词变体（清/暗 l、词首/词尾 t、词尾鼻音、词首 r）+ 2 个短化元音 + 7 个 r 化元音拼接 + 1 个美式 `/oʊ/` 拼接。所有素材为同一位老师，输出统一 22,050 Hz 单声道，没有混入其他说话人。每段原始 MP3 是“目标音读 2 遍 + 每个例词读 2 遍”，脚本只截第 1 遍目标音，并在辅音进入后面元音前截断，去掉教学尾音 schwa，因此拼音序列不会变成“puh-æ-tuh”。课程本身是英式非卷舌音；为匹配 app 中 CMUdict 的美式 IPA，`ɜːr` / `ɑːr` / `ɔːr` / `ər` / `er` / `ɪr` / `ʊr` 由同一位老师的元音 + 短 `/r/` 拼接，`oʊ` 用 `/ɔː/` + `/ʊ/` 拼接。爆破音/破擦音的切片带 **100 ms 静音前导**并单独提高响度，避免手机音频冷启动时短促的爆破被焦点/解码延迟吞掉；拆拼放字母时也不再叠加 660 Hz 提示音。生成脚本：`tools/build_phonics_course.py`；原始素材在 `course_audio/`（仅构建时使用，不打包进 APK）。署名与许可详见 `web/assets/phonics/README.txt`。
- 发音按场景选择：整词按钮用原有整词录音；音素按钮逐音播放；点音块播放 `web/assets/chunks/` 里预先合成的整块音频（ence = /əns/）；拆拼点字母读“这个字母在当前单词里的音”，而不是字母名；词尾 `/l/`、`/t/`、`/m/`、`/n/`、`/ŋ/` 自动选同说话人的词尾变体。当 `/er/`、`/ər/`、`/ɑːr/` 等 r 化音块后面紧跟元音时（very、different、library、eraser），逐音播放会把 r 拆回下一个音节，避免把 “very” 读成 “vair-ee”。音块合成脚本：`tools/build_chunks.py`（66 个多音素音块，去掉音素前导静音并交叉淡化）；相关逻辑在 `web/assets/app.js` 的 `wordPhonemePlan`、`speakChunkPhoneme`、`letterTokenMap`、`playLetterSound`；逐字母映射对同拼写不同读音分场景处理（`le` 在 apple 的 /əl/ 中 l=/l/、e 不发音，在 mile 的 /l/ 中同样 l=/l/；`xe` 的 x 读 /ks/；`nes` 在 Wednesday 中 s=/z/；重复字母 ll/pp/ss 两处都读同一个音；缩写 Mr/Dr/km/kg 整词放在首字母），可用 `tools/audit_chunks.py` 导出 `dist/chunk_audit.csv` 逐条核对；`tools/check_phonics_course.py` 会逐词比对 2983 个词的逐音序列与整词 IPA，当前 **0 处不一致**。
- 牛津/剑桥/Jolly Phonics 的官方教材音频有版权，不能直接打包；如需使用请先取得授权。
- 学习数据保存在 WebView `localStorage`，卸载应用或清除数据会重置。
- 当前为开发调试签名，适合直接安装体验；如需上架应用市场，请替换正式签名并补齐隐私政策等材料。

## 九、逐词音标与发音审计

- 覆盖全部 **2983 个词条（2230 个不同拼写）**，逐条导出报告：`dist/ipa_audio_audit.csv`（含音标、英式参考、字母块、音频文件、是否存在）。
- 审计结果：**0 个缺音标、0 个缺音频、0 个字母块拼接不一致、0 个字母块音标与整词音标不一致**。
- 脚本：
  - `tools/fix_ipa_cmudict.py`：CMUdict 全量音标、重音、弱读、`-ed/-es/-ist/-age` 等规则。
  - `tools/rebuild_chunks.py`：按字母组合（grapheme）重新切块并对齐音标，修复 `ow=/aʊ/` 被拆成 `w=/aʊ/`、`cc=/ks/` 被吞掉等问题。
  - `tools/fix_heteronyms.py`：用语境句强制同形异音词的正确读法（read/live/close/use/record/present 等 29 个）。
  - `tools/fix_entry_specific.py`：同一拼写在不同单元不同读音的条目（read 过去式 /red/、close 形容词 /kloʊs/、research 名词）。
  - `tools/fix_acronyms.py`：AI/OK/PE/PLA/PRC/TV/UK/UN/US/USA/VR/WHO 使用字母名称读音，并与 `us`、`who` 等普通单词分开音频。
  - `tools/export_audit.py`：导出上述 CSV 报告。
- 常见修正示例：engineer /ˌendʒɪˈnɪr/、thirteen /ˌθɜːrˈtiːn/、kilometre /ˈkɪləmiːtər/、pronunciation /prəˌnʌnsiˈeɪʃən/、advertisement /ˌædvərˈtaɪzmənt/、costume /ˈkɑːstuːm/、Dr /ˈdɑːktər/。
- 发音仍为美音；与 PEP 英式音标存在系统性差异的词（laugh /læf/、ask /æsk/、answer /ˈænsər/ 等）属于口音差异，不是错误。如需完全对齐 PEP 英式，可再切一套 UK 音标和音频。
