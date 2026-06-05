# Selection Translator

[中文说明](README.zh-CN.md)

[Features](#features) |
[Quick Start](#quick-start) |
[Settings](#settings) |
[Usage Guide](#usage-guide) |
[Privacy](#privacy) |
[Install](#install) |
[FAQ](#faq) |
[Development](#development)

Selection Translator is an Obsidian plugin for translating selected Markdown editor and PDF text with an OpenAI-compatible Chat API provider.

---

## Features

### Selection Translation

- Translate selected Markdown editor or selectable PDF text from the command palette, a hotkey, the ribbon button, or the Markdown editor context menu.
- Keep the floating popover open while selecting more text; the new Markdown or PDF selection is translated automatically.
- Edit the selected source text in the popover and translate again.

### Language Controls

- Set default source and target languages in plugin settings.
- Adjust source and target languages directly in the translation popover.
- Hide the popover language controls when you prefer a compact header.
- Use `Auto` as the source language when you want the model to detect the input language.

### Popover Workflow

- Stream translation progress, errors, and results in a draggable and resizable popover.
- Use compact header buttons to copy the full result, retry translation, or close the popover.
- Select any part of the translation result and copy it with native keyboard or context-menu copy.
- Header layout is compact for desktop and narrow mobile screens.

### Provider Support

- Works with OpenAI-compatible Chat Completions providers.
- Configure API base URL, API key, model, prompt, temperature, and maximum selection length.
- Test the provider configuration before translating.
- Plugin UI follows Obsidian's app language for English and Simplified Chinese.

---

## Quick Start

1. Install the plugin with BRAT or manual installation.
2. Open **Settings -> Community plugins -> Selection Translator**.
3. Configure **API base URL**, **API key**, and **Model**.
4. Set default **Source language** and **Target language**.
5. Select **Test** to verify the provider configuration.
6. Select text in a Markdown editor or selectable PDF text in Obsidian's PDF view.
7. Run **Translate selection** from the command palette, a hotkey, the ribbon button, or the editor context menu.

The default prompt translates from `Auto` into `Chinese (Simplified)` and returns only the translated text.

---

## Settings

The settings page is grouped into **Provider**, **Translation**, **Popover**, and **Advanced** tabs.

### Provider

| Setting | Default | Description |
| --- | --- | --- |
| API base URL | `https://api.openai.com/v1` | Provider base URL. The plugin appends `/chat/completions` when needed. |
| API key | empty | Bearer token for the configured provider. |
| Model | empty | Model name supported by your provider. |
| Test API configuration | - | Sends a short request to verify the base URL, API key, and model. |

### Translation

| Setting | Default | Description |
| --- | --- | --- |
| Source language | `Auto` | Default source language. Use `Auto` for model detection. |
| Target language | `Chinese (Simplified)` | Default target language. |
| Prompt | built in | Translation instruction. Use `{sourceLanguage}` and `{targetLanguage}` for the configured languages. |

### Popover

| Setting | Default | Description |
| --- | --- | --- |
| Show selected text in popover | enabled | Shows selected text as an editable field before retrying. |
| Show language controls in popover | enabled | Shows source and target language fields in the popover header. |

### Advanced

| Setting | Default | Description |
| --- | --- | --- |
| Temperature | `0.2` | Lower values keep translations more deterministic. |
| Maximum selection length | `4000` | Blocks accidental large sends. |

---

## Usage Guide

### Basic Translation

1. Select text in Markdown or a selectable PDF text layer.
2. Run **Translate selection**.
3. Read the streaming result in the popover.
4. Select part of the result if you only need to copy a specific phrase or paragraph.

### Popover Language Direction

1. Keep **Show language controls in popover** enabled.
2. Change **From** and **To** in the popover header.
3. Select **Translate again** to retry the current source text with the new language direction.
4. Later translations use the latest language values.

### Waiting For The Next Selection

Select the ribbon button before selecting text. The popover opens in a waiting state, then translates the next Markdown editor or PDF selection.

PDF support requires a selectable PDF text layer. Scanned pages without OCR text cannot be translated by selection.

---

## Privacy

This plugin does not collect telemetry and does not scan your vault.

When you translate selected Markdown or PDF text, only the selected text is sent to the OpenAI-compatible provider configured in plugin settings. Do not translate sensitive content unless you trust that provider.

The API key is stored locally in Obsidian plugin data through `saveData()`. It is rendered as a password field in settings, but Obsidian plugin data is local plaintext storage, not encrypted storage. The plugin does not log the API key.

---

## Install

### Install With BRAT

This plugin is distributed as a beta plugin through GitHub releases. Install it with the Obsidian BRAT plugin:

1. Install and enable **BRAT** from Obsidian's community plugins.
2. Open **Settings -> BRAT -> Beta Plugin List**.
3. Select **Add Beta plugin**.
4. Enter this repository URL:

```text
https://github.com/Zhruoshui/obsidian-selection-translator
```

5. Enable **Selection Translator** in **Settings -> Community plugins**.

BRAT installs the release assets from GitHub. Each release must include `main.js`, `manifest.json`, and `styles.css`.

### Manual Installation

Download `main.js`, `manifest.json`, and `styles.css` from the latest GitHub release, then copy them to:

```text
<Vault>/.obsidian/plugins/selection-translator/
```

Reload Obsidian and enable the plugin in **Settings -> Community plugins**.

---

## FAQ

### Configuration test failed

- Confirm the API base URL is correct and reachable.
- Confirm the API key is valid for the selected provider.
- Confirm the model name exists on that provider.

### Translation popup does not appear

- Confirm text is selected in the active Markdown editor or a selectable PDF text layer.
- Try the command palette command **Translate selection**.
- For PDF files, confirm the PDF has selectable text and is not only a scanned image.

### Language controls are not visible

- Enable **Show language controls in popover** in plugin settings.
- On very narrow screens, the language controls may wrap above the icon button row to avoid overlap.

### Source language does not affect output

- Use the default prompt or include `{sourceLanguage}` in your custom prompt.
- The plugin also adds missing language direction context before custom prompts that omit a language placeholder.

---

## Development

Install dependencies:

```bash
npm install
```

Run a production build:

```bash
npm run build
```

Run lint:

```bash
npm run lint
```

---

## Release

The repository is configured to create a GitHub release when a version tag is pushed. The release workflow builds the plugin and uploads the files BRAT needs.

For the first `1.0.0` release from an already versioned commit:

```bash
git tag -a 1.0.0 -m "1.0.0"
git push origin main --follow-tags
```

For later releases, update the npm package version:

```bash
npm version patch
git push origin main --follow-tags
```

Use the exact tag created by `npm version`. Tags do not use a leading `v`.
