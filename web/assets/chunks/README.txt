音块合成音频 / blended chunk audio

这些 WAV 不是新的说话人录音，而是由 web/assets/phonics/ 中的同一位
老师音素按单词里的音块拼接而成。例如 ence /əns/ 由 ə + n + s 组成。

处理方式：
- 去掉每个音素单独播放时加的前导静音；
- 相邻音素交叉淡化 18 ms，中间不留停顿；
- 整段再做响度归一化和淡入淡出。

因此点音块听到的是一段连续的 /əns/，而不是“ə · n · s”三次点击。
重新生成：
  .venv/bin/python tools/build_chunks.py

单音素音块（如 th /θ/）仍然直接使用 phonics 里的原始音素文件。
拆拼点字母时，app 会按音块内字母位置取对应音素，例如：
  ence → e=ə, n=n, c=s, 末尾 e 不发音
  sci  → s=s, c 不单独发音, i=aɪ
