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

Selection Translator 是一个 Obsidian 插件，可以使用可自行选择的 AI 或传统翻译服务商翻译 Markdown 编辑器或 PDF 中选中的文本，并自动处理英文单词词典查询。可选的 AI 问答面板支持基于选中文本继续提问；开启联网搜索后，可让模型在回答前进行网页搜索与页面抓取，以获取最新信息。

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

### AI 问答面板

- 默认关闭。在 **AI 问答** 设置页启用后，翻译浮窗中会出现问答入口。
- 使用独立的 OpenAI 兼容聊天配置（基础 URL / API 密钥 / 模型 / 温度 / 系统提示词），与翻译服务商完全隔离——翻译和问答可以指向不同的服务端。
- 回答在浮窗中流式渲染。多轮对话上下文限定为最近 6 轮 user/assistant 对，超出的旧轮自动丢弃。
- 切换到新的选区时，问答会话会自动重置。

### AI 问答联网搜索（Agent Loop）

- 默认关闭。在 **AI 问答** 页启用 **启用联网搜索** 后，模型在回答前可调用两个工具：
  - `web_search`——Tavily、Serper.dev 或 DuckDuckGo（无需 API 密钥）三选一。
  - `fetch_url`——抓取公开网页并返回正文抽取后的文本。
- 需要聊天模型支持 OpenAI 兼容的 `tool_calls`。开启后，浮窗会在每一轮工具调用时显示 "🔍 Searching …" / "📄 Reading …" 提示，再流式给出最终答案。
- 由 **最大工具调用轮数**（默认 `3`）约束。达到上限后，即使模型仍希望继续搜索，插件也会关闭工具强制给出最终答案，保证你一定会收到回复。
- `fetch_url` 会拒绝非 `http(s)` 协议，以及一份私有 / 本地主机名黑名单（`localhost`、`127.`、`10.`、`192.168.`、`172.16-31.`、`169.254.`、`.local`、`.internal`、IPv6 loopback / link-local / ULA）。这是尽力而为的字符串过滤，并不是完备的 SSRF 防护——详见 [隐私](#隐私)。

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

设置页面按 **服务商**、**词典配置**、**悬浮窗配置**、**高级** 和 **AI 问答** 五个标签页分组。

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

### 高级

| 设置 | 默认值 | 说明 |
| --- | --- | --- |
| 启用缓存 | 开启 | 开启后，相同文本在缓存有效期内重复翻译时跳过网络请求。 |
| 缓存有效期（秒） | `600` | 单条缓存的存活时间。`0` 表示永不过期，否则范围 60-86400。 |
| 缓存最大条目数 | `256` | 最多缓存的翻译数。超出时按 LRU 淘汰最旧条目。 |
| 最小间隔（毫秒） | `1500` | 同一服务商两次翻译请求之间的最小延迟。`0` 表示不节流。 |
| 启用重试 | 开启 | 遇到 429/5xx 与已知限流错误时按下方退避参数自动重试。 |
| 最大尝试次数 | `2` | 总尝试次数（含首次）。`0` 表示完全不重试。 |
| 基础延迟（毫秒） | `500` | 初始退避延迟。后续延迟按指数倍增直到下方上限。 |
| 最大延迟（毫秒） | `3000` | 退避延迟的上限。`baseDelayMs * 2^attempt + jitter` 会截断到该值。 |
| 抖动比例 | `0.2` | 相对指数延迟的随机抖动比例（0-0.5）。 |

翻译服务商的错误响应现在通过 `error.cause.status` 透传 HTTP 状态码。重试循环会优先判断该字段（429 或 5xx ⇒ 重试）；如果不存在则降级到关键词白名单（`invalid access limit`、`rate limit` 等）和数字状态码正则。

### AI 问答

AI 问答标签页维护一份独立的 OpenAI 兼容聊天配置，和翻译服务商完全隔离。关闭该功能会将问答入口从浮窗中隐藏。

| 设置 | 默认值 | 说明 |
| --- | --- | --- |
| 启用 AI 问答 | 关闭 | 在翻译浮窗中显示 AI 问答入口。 |
| AI API 基础 URL | `https://api.openai.com/v1` | 问答使用的 OpenAI 兼容聊天 API 基础 URL。 |
| AI API 密钥 | 空 | 聊天端点使用的 Bearer token。存储在本地 Obsidian 插件数据中。 |
| AI 模型 | 空 | 端点支持的模型名称。 |
| AI 温度 | `0.2` | 较低的值会让回答更稳定。 |
| AI 系统提示词 | 内置 | 提示词模板。使用 `{selectedText}` 表示插入选中文本的位置；未包含时会自动在末尾附加选中文本。 |
| 测试 AI 配置 | - | 发送一次简短聊天请求，验证 URL / 密钥 / 模型是否可用。 |

#### 联网搜索

AI 问答配置下方是 **联网搜索** 区块，可让问答 Agent 在回答前调用 `web_search` 与 `fetch_url`。需要聊天模型支持 OpenAI 兼容的 `tool_calls`。关闭时，请求体不会携带 `tools` 字段，线格式与普通 chat completion 完全一致。

| 设置 | 默认值 | 说明 |
| --- | --- | --- |
| 启用联网搜索 | 关闭 | 启用 Agent Loop。关闭时，下方所有字段都会隐藏。 |
| 搜索后端 | `DuckDuckGo（无需 API 密钥）` | `web_search` 工具使用的搜索 API。可选：Tavily、Serper.dev、DuckDuckGo。 |
| 搜索 API 密钥 | 空 | Tavily / Serper.dev 需要；选择 DuckDuckGo 时该字段隐藏。 |
| 最大工具调用轮数 | `3` | 工具调用轮数上限。达到上限后，插件会关闭工具强制给出最终答案。范围 1-8。 |
| 每次搜索返回结果数 | `5` | 每次 `web_search` 返回给模型的结果条数。范围 1-10。 |
| `fetch_url` 抓取字符上限 | `8000` | 传回给模型的网页正文最大字符数。超出时会截断并追加标记。范围 1000-40000。 |

| 搜索后端 | API 使用说明 | Key 获取入口 | 价格说明 |
| --- | --- | --- | --- |
| Tavily | 面向 LLM 场景的搜索 API。提供免费额度；需要 API 密钥。 | [Tavily 文档](https://docs.tavily.com/) | [Tavily 价格](https://tavily.com/#pricing) |
| Serper.dev | 通过 REST API 访问 Google 搜索结果。提供免费额度；需要 API 密钥。 | [Serper.dev 文档](https://serper.dev/) | [Serper.dev 价格](https://serper.dev/pricing) |
| DuckDuckGo | 解析公开的 HTML 端点（`https://html.duckduckgo.com/html/`）。无需 API 密钥。稳定性较低，可能对频繁访问限流。 | - | - |

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

### 基于选区的 AI 问答

1. 在设置里启用 **AI 问答**，填入 API 基础 URL、API 密钥和模型。
2. 翻译一次选中文本，打开浮窗。
3. 打开 **AI 问答** 入口，针对选中文本输入后续问题并发送。
4. 回答在浮窗中流式返回。可继续提问以构建多轮对话，最近 6 轮会作为上下文保留。
5. 切换到新的选区会自动重置问答会话。

### AI 问答联网搜索

1. 在 **AI 问答** 页启用 **启用联网搜索**，选择 **搜索后端**（Tavily / Serper.dev 需要填入搜索 API 密钥）。
2. 提一个需要时效信息的问题（例如"某某今天发布了什么？"）。
3. 模型运行 Agent Loop 时，浮窗会为每一轮工具调用显示一行提示（`🔍 Searching "…"` 或 `📄 Reading …`），随后流式给出最终答案。
4. 若模型在达到 **最大工具调用轮数** 后仍希望继续搜索，插件会关闭工具强制给出最终答案——你一定会收到回复。

---

## 隐私

本插件不收集遥测数据，也不会扫描你的 vault。

翻译 Markdown 或 PDF 选中文本时，只有被选中的文本会发送到插件设置中当前选择的翻译服务商。只选择一个英文单词时，该单词会改为发送到配置的词典服务商，并在可用时从该服务商加载发音音频。除非你信任该服务商，否则不要翻译敏感内容。

使用 AI 问答时，选中文本和你输入的问题会发送到 **AI 问答** 页配置的聊天端点（与翻译服务商独立）。启用联网搜索后，你的搜索关键词还会发送到所选搜索后端（Tavily / Serper.dev / DuckDuckGo）；若模型触发 `fetch_url`，插件会在你的 Obsidian 进程中向对应的公开 URL 发起 HTTP GET。除选中文本、你的问题、以及模型选择抓取的 URL 之外，插件不会从 vault 中额外发送任何内容。

`fetch_url` 会拒绝非 `http(s)` 协议，并按一份字符串黑名单拦截私有 / 本地主机名。这只是尽力而为的过滤——Obsidian 插件沙盒没有 DNS 解析 API，因此**无法**防御 DNS rebinding 或十进制编码 IPv4 字面量等攻击。如果你对出站流量有强安全要求，请通过在网络层强制策略的出站代理运行插件。

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
