# Changelog

## 1.2.0 - 2026-07-08

### English

#### Added

- Normalized the selected text before sending it to the translator: in-paragraph
  line breaks and runs of whitespace are folded into a single space, paragraph
  breaks (blank lines) are preserved, and Markdown code fences are left intact.
- Wrapped the translation pipeline in a per-provider throttle (1500 ms floor)
  and a short-lived retry loop (up to 2 retries, exponential backoff with
  jitter, AbortError is never retried) so quick re-selections no longer trip
  upstream rate limits such as "Invalid Access Limit".
- Added a 10-minute translation cache keyed by `(text, provider, source,
  target)` with a 256-entry LRU ceiling. Cache hits skip the network, the
  throttle, and the retry path entirely; settings changes and plugin unload
  clear the cache.
- Replaced the 0 ms `pointerup`/`keyup` flush with a 250 ms stable debounce
  so a burst of selection changes only fires one translation request.

### 中文

#### 新增

- 翻译前对选中文本做规范化：段内换行与连续空白折叠为单个空格，段落分隔（空行）保留，Markdown 代码块围栏内的换行不被改动。
- 给翻译流水线加上按服务商 1500 ms 节流与最多 2 次的指数退避重试（带抖动，AbortError 不重试），避免短时间多次选区触发上游 "Invalid Access Limit" 限流。
- 新增 10 分钟翻译结果缓存，键为 `(文本, 服务商, 源语言, 目标语言)`，上限 256 条 LRU 淘汰。命中时跳过网络请求、节流与重试；设置变更和插件卸载会清空缓存。
- 将 `pointerup`/`keyup` 的 0 ms 立即发送改为 250 ms 稳定防抖，连贯选区操作只产生一次翻译请求。

## 1.1.1 - 2026-06-08

### English

#### Fixed

- Made the translation popover adapt its default width and text area height to
  the current window and translation content.
- Reduced visible lag after changing the active selection while the popover is
  open.
- Fixed stale selected text in the source text box when a new selection starts a
  new translation task.

### 中文

#### 修复

- 优化翻译悬浮窗的默认宽度和文本框高度，使其根据当前窗口大小和翻译内容自适应。
- 减少悬浮窗打开后切换划词选区时的可感知延迟。
- 修复新选区触发翻译时，源文本框仍显示上一条选区内容的问题。

## 1.1.0 - 2026-06-05

### English

#### Added

- Added dictionary lookup support for selected single English words.
- Added configurable dictionary providers: Youdao, Bing, and Cambridge.
- Added pronunciation audio controls for dictionary results when available.

#### Changed

- Condensed the translation popover and settings layout.
- Routed single-word English selections to dictionary lookup automatically.

### 中文

#### 新增

- 支持对选中的单个英文单词进行词典查询。
- 支持配置词典服务商：有道、必应和剑桥。
- 词典结果可用时，显示发音音频控制。

#### 变更

- 精简翻译悬浮窗和设置界面的布局。
- 自动将单个英文单词选区路由到词典查询。

## 1.0.0 - 2026-06-04

### English

#### Added

- Published the initial BRAT-ready release of Selection Translator.
- Added selected-text translation through configurable translation providers.
- Added plugin settings, release workflow, and installation documentation.

### 中文

#### 新增

- 发布首个支持 BRAT 安装的 Selection Translator 版本。
- 支持通过可配置的翻译服务商翻译选中文本。
- 添加插件设置、发布工作流和安装文档。
