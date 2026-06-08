# Changelog

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
