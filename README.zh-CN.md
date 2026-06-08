# Selection Translator

[English](README.md)

[功能](#功能) |
[快速开始](#快速开始) |
[设置](#设置) |
[使用指南](#使用指南) |
[隐私](#隐私) |
[安装](#安装) |
[开发](#开发) |
[常见问题](#常见问题)

Selection Translator 是一个 Obsidian 插件，可以使用可自行选择的 AI 或传统翻译服务商翻译 Markdown 编辑器或 PDF 中选中的文本，并自动处理英文单词词典查询。

![f_start](./img/f_start.png)

---

## 功能

### 划词翻译

- 通过命令面板、快捷键、左侧功能区按钮或 Markdown 编辑器右键菜单翻译选中的 Markdown 或可选择 PDF 文本。
- 悬浮窗保持打开时，继续选择其他 Markdown 或 PDF 文本会自动翻译新的选择。
- 可以在悬浮窗中编辑源文本后重新翻译。
- 只选择一个英文单词时会自动使用配置的词典服务商查询，并在可用时播放英音/美音发音。

![f_dictionary](./img/f_dictionary.png)

### 语言设置

- 在插件设置中配置默认源语言和目标语言。
- 源语言使用 `Auto` 时，由支持的服务商自动识别输入语言。

![setting](./img/settings.png)

### 悬浮窗工作流

- 在可拖动、可调整大小的悬浮窗中显示流式翻译状态、错误和结果。
- 顶部使用紧凑图标按钮复制完整译文、重新翻译或关闭悬浮窗。
- 译文结果支持自由选择，可以只复制其中任意片段。
- 顶部布局兼顾桌面端和较窄的移动端屏幕。

<p align="center">
  <img src="./img/f_dictionary_m.jpg" alt="词典查询移动端" width="30%">
</p>

### 服务商支持

- 用户自行选择文本翻译服务商。OpenAI 兼容服务商、Bing 翻译（Microsoft Translator）、Google 翻译、DeepL、百度翻译和有道翻译都是可选项。
- 根据当前选择的服务商配置所需凭据。
- OpenAI 兼容服务商支持提示词、温度和流式输出。传统翻译 API 会在服务商请求完成后返回译文。
- 只选择一个英文单词时会自动使用配置的词典服务商。有道词典、必应词典和剑桥词典均可选择，且不需要 API 密钥。
- 翻译前可以测试服务商配置是否可用。
- 插件界面跟随 Obsidian 应用语言，目前支持 English 和简体中文。

![provider](./img/provider.png)

---

## 快速开始

1. 通过 BRAT 或手动安装插件。
2. 打开 **Settings -> Community plugins -> Selection Translator**。
3. 选择 **翻译服务商**。
4. 如果不想使用默认的有道词典，可以选择 **词典服务商**。
5. 配置翻译服务商需要的凭据。
6. 设置默认 **源语言** 和 **目标语言**。
7. 选择 **测试** 验证翻译服务商配置。
8. 在 Markdown 编辑器或 Obsidian PDF 视图中选择可选中的 PDF 文本。
9. 从命令面板、快捷键、左侧功能区按钮或编辑器右键菜单运行 **Translate selection**。

默认提示词会从 `Auto` 翻译到 `Chinese (Simplified)`，并且只返回译文。

---

## 设置

设置页面按 **服务商**、**词典配置** 和 **悬浮窗配置** 三个标签页分组。

### 服务商

| 设置 | 默认值 | 说明 |
| --- | --- | --- |
| 翻译服务商 | `OpenAI 兼容` | 选择由哪个服务商处理非词典翻译请求。 |
| 源语言 | `Auto` | 默认源语言。使用 `Auto` 表示由支持的服务商自动识别。 |
| 目标语言 | `Chinese (Simplified)` | 默认目标语言。 |
| OpenAI 兼容 API 基础 URL | `https://api.openai.com/v1` | 服务商基础 URL。必要时插件会追加 `/chat/completions`。 |
| OpenAI 兼容 API 密钥 | 空 | 当前 OpenAI 兼容服务商的 Bearer token。 |
| OpenAI 兼容模型 | 空 | 服务商支持的模型名称。 |
| OpenAI 兼容提示词 | 内置 | OpenAI 兼容服务商使用的翻译指令。使用 `{sourceLanguage}` 和 `{targetLanguage}` 表示配置的语言。 |
| OpenAI 兼容温度 | `0.2` | 较低的值会让 OpenAI 兼容翻译结果更稳定。 |
| 最大选中文本长度 | `4000` | 阻止意外发送过长文本。此设置显示在 OpenAI 兼容选项中，但会在所有服务商请求前生效。 |
| Bing/Microsoft Translator 密钥 | 空 | Bing 翻译使用的 Microsoft Translator 资源订阅密钥。 |
| Bing/Microsoft Translator 区域 | 空 | 资源区域，例如 `eastasia` 或 `global`。 |
| Bing/Microsoft Translator 端点 | `https://api.cognitive.microsofttranslator.com` | Translator 端点。 |
| Google 翻译 API 密钥 | 空 | Google Cloud Translation Basic v2 的 API 密钥。 |
| DeepL Auth Key | 空 | DeepL 账号中的认证密钥。 |
| DeepL API 基础 URL | `https://api-free.deepl.com` | DeepL Pro 可使用 `https://api.deepl.com`。 |
| 百度翻译 App ID | 空 | 百度翻译开放平台中的 App ID。 |
| 百度翻译密钥 | 空 | 百度翻译开放平台中的密钥。 |
| 有道翻译 App Key | 空 | 有道智云翻译服务中的 App Key。 |
| 有道翻译 App Secret | 空 | 有道智云翻译服务中的 App Secret。 |
| 测试 API 配置 | - | 发送一个简短翻译请求，验证当前选择的服务商配置。 |

Google 翻译和 Bing 翻译的网页端可以免费手动使用，但本插件对这些翻译服务商调用的是官方 API。即使服务商提供免费额度或免费层，API 调用也仍然需要配置对应的凭据。只选择一个英文单词时会自动使用配置的词典网站查询，不需要 API 凭据。

| 服务商 | API 使用说明 | Key 获取入口 | 价格说明 |
| --- | --- | --- | --- |
| Bing 翻译（Microsoft Translator） | Azure Translator API 有 F0 免费层，但仍需要创建 Azure Translator 资源，并配置 key、endpoint，部分资源还需要 region。 | [创建 Translator 资源](https://learn.microsoft.com/en-us/azure/ai-services/translator/create-translator-resource) | [Azure Translator 价格](https://azure.microsoft.com/pricing/details/cognitive-services/translator/) |
| Google 翻译 | Cloud Translation 有每月免费用量抵扣，但 API 调用需要 Google Cloud 项目、结算账号、启用 API 和凭据。 | [Cloud Translation 设置](https://cloud.google.com/translate/docs/setup)、[创建 API Key](https://cloud.google.com/docs/authentication/api-keys#create) | [Cloud Translation 价格](https://cloud.google.com/translate/pricing) |
| DeepL | 需要 DeepL API 账号和 Auth Key。API Free 使用 `https://api-free.deepl.com`，API Pro 使用 `https://api.deepl.com`。 | [DeepL API 鉴权](https://developers.deepl.com/docs/getting-started/auth) | [DeepL API 套餐](https://www.deepl.com/pro-api) |
| 百度翻译 | 需要百度翻译开放平台的 App ID 和密钥。 | [百度翻译 API 文档](https://fanyi-api.baidu.com/doc/21)、[开放平台官网](https://fanyi-api.baidu.com/) | [百度翻译产品](https://fanyi-api.baidu.com/product/11) |
| 有道翻译 | 需要有道智云的 App Key 和 App Secret。 | [新手指南](https://ai.youdao.com/doc.s#guide)、[应用管理](https://ai.youdao.com/appmgr.s)、[文本翻译 API 文档](https://ai.youdao.com/DOCSIRMA/html/trans/api/wbfy/index.html) | [有道文本翻译价格](https://ai.youdao.com/DOCSIRMA/html/trans/price/wbfy/index.html) |
| 词典查询 | 不需要 API 密钥。它会把单个选中的英文单词发送到配置的词典网站，并在可用时使用该服务商的发音音频 URL。 | [有道词典](https://m.youdao.com/dict)、[必应词典](https://cn.bing.com/dict)、[剑桥词典](https://dictionary.cambridge.org/) | - |

### 词典配置

| 设置 | 默认值 | 说明 |
| --- | --- | --- |
| 词典服务商 | `有道词典` | 选择单词词典查询使用的词典网站。可选：有道词典、必应词典、剑桥词典。 |

### 悬浮窗配置

| 设置 | 默认值 | 说明 |
| --- | --- | --- |
| 在悬浮窗显示选中文本 | 开启 | 将选中文本显示为可编辑输入框，便于修改后重新翻译。 |

---

## 使用指南

### 基础翻译

1. 在 Markdown 或可选择的 PDF 文本层中选择文本。
2. 运行 **Translate selection**。
3. 在悬浮窗中查看流式译文。
4. 如果只需要复制某个词句或段落，可以直接选择译文中的任意部分并复制。

### 词典查询

1. 在 Markdown 或可选择的 PDF 文本层中选择一个英文单词。
2. 运行 **Translate selection**。
3. 使用结果标题行中的发音按钮播放英音或美音。

### 调整语言方向

1. 打开插件设置。
2. 在 **服务商** 标签页修改 **源语言** 和 **目标语言**。
3. 再次运行 **Translate selection**。后续翻译会使用保存后的语言值。

### 等待下一次选择

可以先点击左侧功能区按钮。悬浮窗会进入等待状态，并在你下一次选择 Markdown 或 PDF 文本时自动翻译。

PDF 支持依赖可选择的 PDF 文本层。没有 OCR 文本的扫描件页面无法通过选择文本翻译。

---

## 隐私

本插件不收集遥测数据，也不会扫描你的 vault。

翻译 Markdown 或 PDF 选中文本时，只有被选中的文本会发送到插件设置中当前选择的翻译服务商。只选择一个英文单词时，该单词会改为发送到配置的词典服务商，并在可用时从该服务商加载发音音频。除非你信任该服务商，否则不要翻译敏感内容。

服务商凭据通过 Obsidian 插件数据的 `saveData()` 存储在本地。密钥字段会显示为密码输入框，但 Obsidian 插件数据是本地明文存储，不是加密存储。本插件不会记录服务商凭据。

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

![brat](./img/brat.png)

5. 在 **Settings -> Community plugins** 中启用 **Selection Translator**。

BRAT 会从 GitHub release 安装插件文件。每个 release 都需要包含 `main.js`、`manifest.json` 和 `styles.css`。

### 手动安装

从最新 GitHub release 下载 `main.js`、`manifest.json` 和 `styles.css`，然后复制到：

```text
<Vault>/.obsidian/plugins/selection-translator/
```

重新加载 Obsidian，并在 **Settings -> Community plugins** 中启用插件。

---

## 开发

### 使用符号链接开发

开发时，可以将仓库软链接到 vault 的 plugins 目录下，这样执行 `npm run build` 后直接在 Obsidian 中重载插件即可，无需手动复制文件。

**Linux / macOS**：

```bash
ln -s /path/to/obsidian-selection-translator "<Vault>/.obsidian/plugins/selection-translator"
```

**Windows**（需要管理员权限或开启开发者模式）：

```cmd
mklink /D "<Vault>\.obsidian\plugins\selection-translator" "C:\path\to\obsidian-selection-translator"
```

Windows 上也可以使用目录联接（无需管理员权限）：

```cmd
mklink /J "<Vault>\.obsidian\plugins\selection-translator" "C:\path\to\obsidian-selection-translator"
```

链接完成后，`npm run build` 会将 `main.js` 直接编译到插件目录。在 Obsidian 中重载或禁用再启用插件即可看到更改。

---

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

## 常见问题

### 配置测试失败

- 确认 API 基础 URL 正确并且可以访问。
- 确认凭据对当前选择的服务商有效。
- 对于 OpenAI 兼容服务商，确认模型名称存在于该服务商。

### 翻译悬浮窗没有出现

- 确认当前 Markdown 编辑器或可选择 PDF 文本层中有选中文本。
- 尝试从命令面板运行 **Translate selection**。
- 对于 PDF，确认它有可选择文本，而不是只有扫描图片。

### 源语言没有明显影响输出

- 使用默认提示词，或在自定义提示词中包含 `{sourceLanguage}`。
- 如果自定义提示词缺少语言占位符，插件也会在提示词前补充缺失的语言方向上下文。

---

## 许可

本项目采用 MIT 许可证，可自由使用、修改、分发，保留版权与许可声明即可。

---

## 致谢

感谢 LinuxDo 社区（https://linux.do）的支持。
