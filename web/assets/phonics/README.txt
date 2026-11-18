音素音频来源与许可 / Phoneme audio attribution

本目录的 66 个 WAV 来自用户提供的「48个国际音标 24天打卡」跟读课程：

  来源：48个国际音标24天打卡小纸条.pdf
       跟读音频（音标与例词）/ Day1-1.MP3 ... Day24-2.MP3

PDF 是 48 个国际音标的分类表；每个 DayX-1 / DayX-2 音频对应一个
音标。每段音频的结构是：目标音读 2 遍，然后每个例词读 2 遍。
本应用只截取第 1 遍目标音；辅音如果带后面的弱读 schwa，会在进入
元音前截断，避免音素序列出现 “puh-æ-tuh”。

48 个基础音：
  单元音 12：ɑː iː uː ɜː ɔː ʌ ɪ ʊ ə ɒ e æ
  双元音 8：eɪ aɪ ɔɪ ɪə eə ʊə əʊ aʊ
  辅音 28：p t k b d g f s θ ʃ h v z ð ʒ tʃ tr ts dʒ dr dz
            m n ŋ r l w j

另外 18 个文件是同一说话人的场景变体和美式拼合：
- l_clear / l_dark：like 的词首清 l、ball 的词尾暗 l
- t_initial / t_final：tea 的词首 t、boat 的词尾 t
- m_final / n_final / ng_final：mum、n、song 的词尾鼻音
- r_initial：red 的词首 r
- v_i_happy / v_u_reduced：短 i、短 u
- ɜːr / ɑːr / ɔːr / ər / er / ɪr / ʊr：同一位说话人的元音 + 短 /r/
- oʊ：同一位说话人的 /ɔː/ + /ʊ/，匹配 app 中 CMUdict 的美式 IPA

所有音素、例词变体和拼合音都来自同一位老师，没有混入其他说话人。
输出统一为 22,050 Hz、单声道、16-bit PCM。

关于“不同场景”：
- 整词按钮：播放 app 原有的整词录音，保持自然连读。
- 音素按钮：逐音播放当前单词的 IPA。
- 点音块：播放 assets/chunks/ 里按当前音块预合成的整段音频，例如
  ence 读 /əns/，不会拆成 ə · n · s 三段。
- 拆拼点字母：播放这个字母在“当前单词”里的音，而不是字母名；
  多字母音块会按字母位置拆分（ence：e=ə、n=n、c=s、末尾 e 不发音）。
- r 化音块后接元音时（very、different、library、eraser），逐音播放
  会把 /er/、/ər/、/ɪr/ 拆回“元音 + /r/”，让 r 归到下一个音节。
- 词尾 /l/、/t/、/m/、/n/、/ŋ/ 自动选同说话人的词尾变体。

爆破音 /p b t d k g/ 和破擦音 /tʃ dʒ tr dr ts dz/ 的切片带
100 ms 静音前导，并比元音略提高响度。手机音频冷启动需要时间申请
焦点/初始化解码器；没有前导时，最先播放的 /p/、/t/ 可能整个被吞掉，
听起来像“没有声音”。其他辅音带 50 ms 前导，元音带 50 ms 前导。

重新生成：
  .venv/bin/python tools/build_phonics_course.py

脚本读取 app/course_audio/ 下的 48 个 MP3，重新生成全部 WAV 和
manifest.json。如需替换音频，请保持 manifest.json 中的文件名不变。
原始课程音频仅用于构建，不打包进 APK；APK 只包含本目录的 WAV。
