# Selection Translator

[English](README.md)

Selection Translator 是一个 Obsidian 社区插件，可以使用 OpenAI 兼容的 Chat API 服务商翻译 Markdown 编辑器或 PDF 中选中的文本。

## 功能

- 通过命令面板、快捷键或左侧功能区按钮翻译当前 Markdown 编辑器或 PDF 中选中的文本。
- 从 Markdown 编辑器右键菜单翻译选中文本。
- 在悬浮窗中显示流式翻译状态、错误和结果。
- 悬浮窗保持打开时，继续选择其他 Markdown 编辑器或 PDF 文本会自动翻译新的选择。
- 可以拖动悬浮窗标题栏调整位置，也可以拖动右下角调整大小。
- 支持复制、重试和关闭翻译结果。
- 支持配置和测试 API 基础 URL、API 密钥、模型、目标语言、提示词、温度和最大选中文本长度。
- 插件界面跟随 Obsidian 应用语言，目前支持 English 和简体中文。

默认提示词会将选中文本翻译为简体中文，并且只返回译文。

## 通过 BRAT 安装

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

## 隐私

本插件不收集遥测数据，也不会扫描你的 vault。

翻译 Markdown 或 PDF 选中文本时，只有被选中的文本会发送到插件设置中配置的 OpenAI 兼容服务商。除非你信任该服务商，否则不要翻译敏感内容。

API 密钥通过 Obsidian 插件数据的 `saveData()` 存储在本地。设置页会把它显示为密码输入框，但 Obsidian 插件数据是本地明文存储，不是加密存储。本插件不会记录 API 密钥。

## 设置

- **API 基础 URL**：服务商基础 URL，例如 `https://api.openai.com/v1`。
- **API 密钥**：用于配置服务商的 Bearer token。
- **模型**：服务商支持的模型名称。
- **目标语言**：默认是 `Chinese (Simplified)`。
- **提示词**：翻译指令。使用 `{targetLanguage}` 表示目标语言插入位置。
- **温度**：默认是 `0.2`。
- **最大选中文本长度**：阻止意外发送过长文本。

## 使用

1. 打开 **Settings -> Community plugins -> Selection Translator**。
2. 配置 API 基础 URL、API 密钥和模型。
3. 选择 **Test** 测试 API 配置。
4. 在 Markdown 编辑器或 Obsidian PDF 视图中选择可选中的 PDF 文本。
5. 从命令面板、快捷键、左侧功能区按钮或 Markdown 编辑器右键菜单运行 **Translate selection**。
6. 可选：打开 **Settings -> Hotkeys**，为 **Selection Translator: Translate selection** 绑定快捷键。
7. 也可以先选择左侧功能区按钮；它会打开悬浮窗并等待下一次 Markdown 编辑器或 PDF 文本选择。
8. 保持悬浮窗打开时，继续选择其他 Markdown 编辑器或 PDF 文本即可翻译，不需要再次运行命令。

PDF 支持依赖可选择的 PDF 文本层。没有 OCR 文本的扫描件页面无法通过选择文本翻译。

## 手动安装

从最新 GitHub release 下载 `main.js`、`manifest.json` 和 `styles.css`，然后复制到：

```text
<Vault>/.obsidian/plugins/selection-translator/
```

重新加载 Obsidian，并在 **Settings -> Community plugins** 中启用插件。

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
