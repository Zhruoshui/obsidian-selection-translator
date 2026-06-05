# Selection Translator

[English](README.md)

[功能](#功能) |
[快速开始](#快速开始) |
[设置](#设置) |
[使用指南](#使用指南) |
[隐私](#隐私) |
[安装](#安装) |
[常见问题](#常见问题) |
[开发](#开发)

Selection Translator 是一个 Obsidian 插件，可以使用 OpenAI 兼容的 Chat API 服务商翻译 Markdown 编辑器或 PDF 中选中的文本。

---

## 功能

### 划词翻译

- 通过命令面板、快捷键、左侧功能区按钮或 Markdown 编辑器右键菜单翻译选中的 Markdown 或可选择 PDF 文本。
- 悬浮窗保持打开时，继续选择其他 Markdown 或 PDF 文本会自动翻译新的选择。
- 可以在悬浮窗中编辑源文本后重新翻译。

### 语言设置

- 在插件设置中配置默认源语言和目标语言。
- 也可以直接在翻译悬浮窗中调整源语言和目标语言。
- 如果希望悬浮窗更紧凑，可以隐藏顶部语言设置。
- 源语言使用 `Auto` 时，由模型自动识别输入语言。

### 悬浮窗工作流

- 在可拖动、可调整大小的悬浮窗中显示流式翻译状态、错误和结果。
- 顶部使用紧凑图标按钮复制完整译文、重新翻译或关闭悬浮窗。
- 译文结果支持自由选择，可以只复制其中任意片段。
- 顶部布局兼顾桌面端和较窄的移动端屏幕。

### 服务商支持

- 支持 OpenAI 兼容的 Chat Completions 服务商。
- 可配置 API 基础 URL、API 密钥、模型、提示词、温度和最大选中文本长度。
- 翻译前可以测试服务商配置是否可用。
- 插件界面跟随 Obsidian 应用语言，目前支持 English 和简体中文。

---

## 快速开始

1. 通过 BRAT 或手动安装插件。
2. 打开 **Settings -> Community plugins -> Selection Translator**。
3. 配置 **API 基础 URL**、**API 密钥** 和 **模型**。
4. 设置默认 **源语言** 和 **目标语言**。
5. 选择 **测试** 验证服务商配置。
6. 在 Markdown 编辑器或 Obsidian PDF 视图中选择可选中的 PDF 文本。
7. 从命令面板、快捷键、左侧功能区按钮或编辑器右键菜单运行 **Translate selection**。

默认提示词会从 `Auto` 翻译到 `Chinese (Simplified)`，并且只返回译文。

---

## 设置

设置页面按 **服务商**、**翻译**、**悬浮窗** 和 **高级** 四个标签页分组。

### 服务商

| 设置 | 默认值 | 说明 |
| --- | --- | --- |
| API 基础 URL | `https://api.openai.com/v1` | 服务商基础 URL。必要时插件会追加 `/chat/completions`。 |
| API 密钥 | 空 | 用于配置服务商的 Bearer token。 |
| 模型 | 空 | 服务商支持的模型名称。 |
| 测试 API 配置 | - | 发送一个简短请求验证基础 URL、API 密钥和模型。 |

### 翻译

| 设置 | 默认值 | 说明 |
| --- | --- | --- |
| 源语言 | `Auto` | 默认源语言。使用 `Auto` 表示由模型自动识别。 |
| 目标语言 | `Chinese (Simplified)` | 默认目标语言。 |
| 提示词 | 内置 | 翻译指令。使用 `{sourceLanguage}` 和 `{targetLanguage}` 表示配置的语言。 |

### 悬浮窗

| 设置 | 默认值 | 说明 |
| --- | --- | --- |
| 在悬浮窗显示选中文本 | 开启 | 将选中文本显示为可编辑输入框，便于修改后重新翻译。 |
| 在悬浮窗显示语言设置 | 开启 | 在悬浮窗顶部显示源语言和目标语言输入框。 |

### 高级

| 设置 | 默认值 | 说明 |
| --- | --- | --- |
| 温度 | `0.2` | 较低的值会让翻译结果更稳定。 |
| 最大选中文本长度 | `4000` | 阻止意外发送过长文本。 |

---

## 使用指南

### 基础翻译

1. 在 Markdown 或可选择的 PDF 文本层中选择文本。
2. 运行 **Translate selection**。
3. 在悬浮窗中查看流式译文。
4. 如果只需要复制某个词句或段落，可以直接选择译文中的任意部分并复制。

### 在悬浮窗调整语言方向

1. 保持 **在悬浮窗显示语言设置** 为开启。
2. 在悬浮窗顶部修改 **源** 和 **目标**。
3. 选择 **重新翻译**，使用新的语言方向重试当前源文本。
4. 后续翻译会使用最新的语言值。

### 等待下一次选择

可以先点击左侧功能区按钮。悬浮窗会进入等待状态，并在你下一次选择 Markdown 或 PDF 文本时自动翻译。

PDF 支持依赖可选择的 PDF 文本层。没有 OCR 文本的扫描件页面无法通过选择文本翻译。

---

## 隐私

本插件不收集遥测数据，也不会扫描你的 vault。

翻译 Markdown 或 PDF 选中文本时，只有被选中的文本会发送到插件设置中配置的 OpenAI 兼容服务商。除非你信任该服务商，否则不要翻译敏感内容。

API 密钥通过 Obsidian 插件数据的 `saveData()` 存储在本地。设置页会把它显示为密码输入框，但 Obsidian 插件数据是本地明文存储，不是加密存储。本插件不会记录 API 密钥。

---

## 安装

### 通过 BRAT 安装

本插件通过 GitHub release 作为 beta 插件分发。可以使用 Obsidian 的 BRAT 插件安装：

1. 在 Obsidian 社区插件中安装并启用 **BRAT**。
2. 打开 **Settings -> BRAT -> Beta Plugin List**。
3. 选择 **Add Beta plugin**。
4. 输入这个仓库地址：

```text
https://github.com/Zhruoshui/obsidian-selection-translator
```

5. 在 **Settings -> Community plugins** 中启用 **Selection Translator**。

BRAT 会从 GitHub release 安装插件文件。每个 release 都需要包含 `main.js`、`manifest.json` 和 `styles.css`。

### 手动安装

从最新 GitHub release 下载 `main.js`、`manifest.json` 和 `styles.css`，然后复制到：

```text
<Vault>/.obsidian/plugins/selection-translator/
```

重新加载 Obsidian，并在 **Settings -> Community plugins** 中启用插件。

---

## 常见问题

### 配置测试失败

- 确认 API 基础 URL 正确并且可以访问。
- 确认 API 密钥对当前服务商有效。
- 确认模型名称存在于该服务商。

### 翻译悬浮窗没有出现

- 确认当前 Markdown 编辑器或可选择 PDF 文本层中有选中文本。
- 尝试从命令面板运行 **Translate selection**。
- 对于 PDF，确认它有可选择文本，而不是只有扫描图片。

### 悬浮窗里看不到语言设置

- 在插件设置中开启 **在悬浮窗显示语言设置**。
- 在非常窄的屏幕上，语言输入可能会换到图标按钮上方，以避免重叠。

### 源语言没有明显影响输出

- 使用默认提示词，或在自定义提示词中包含 `{sourceLanguage}`。
- 如果自定义提示词缺少语言占位符，插件也会在提示词前补充缺失的语言方向上下文。

---

## 开发

安装依赖：

```bash
npm install
```

运行生产构建：

```bash
npm run build
```

运行 lint：

```bash
npm run lint
```

---

## 发布

仓库配置了 GitHub Actions：推送版本 tag 时会创建 GitHub release。release workflow 会构建插件并上传 BRAT 需要的文件。

如果要从已经设置好版本号的提交发布第一个 `1.0.0` 版本：

```bash
git tag -a 1.0.0 -m "1.0.0"
git push origin main --follow-tags
```

后续发布时，更新 npm package 版本：

```bash
npm version patch
git push origin main --follow-tags
```

使用 `npm version` 创建的准确 tag。tag 不带前缀 `v`。
