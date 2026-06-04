# Selection Translator

Selection Translator is an Obsidian community plugin that translates selected Markdown editor or PDF text with an OpenAI-compatible Chat API provider.

## Features

- Translate the current Markdown editor or PDF selection from the command palette, a hotkey, or the left ribbon button.
- Translate selected editor text from the editor context menu.
- Show streaming translation status, errors, and results in a floating popover.
- Keep the popover open while you select more Markdown editor or PDF text, then translate the new selection automatically.
- Drag the popover header to move it, and drag the bottom-right handle to resize it.
- Copy, retry, or close the translation result.
- Configure and test API base URL, API key, model, target language, prompt, temperature, and maximum selection length.
- Follow Obsidian's app language for supported plugin UI locales: English and Simplified Chinese.

The default prompt translates selected text into Simplified Chinese and returns only the translated text.

## Install with BRAT

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

## Privacy

This plugin does not collect telemetry and does not scan your vault.

When you translate selected Markdown or PDF text, only the selected text is sent to the OpenAI-compatible provider configured in plugin settings. Do not translate sensitive content unless you trust that provider.

The API key is stored locally in Obsidian plugin data through `saveData()`. It is rendered as a password field in settings, but Obsidian plugin data is local plaintext storage, not encrypted storage. The plugin does not log the API key.

## Settings

- **API base URL**: Provider base URL, for example `https://api.openai.com/v1`.
- **API key**: Bearer token used for the configured provider.
- **Model**: Model name supported by the provider.
- **Target language**: Defaults to `Chinese (Simplified)`.
- **Prompt**: Translation instruction. Use `{targetLanguage}` where the target language should be inserted.
- **Temperature**: Defaults to `0.2`.
- **Maximum selection length**: Blocks accidental large sends.

## Usage

1. Open **Settings -> Community plugins -> Selection Translator**.
2. Configure API base URL, API key, and model.
3. Select **Test** to verify the API configuration.
4. Select text in a Markdown editor or selectable PDF text in Obsidian's PDF view.
5. Run **Translate selection** from the command palette, a hotkey, the left ribbon button, or the Markdown editor context menu.
6. Optional: open **Settings -> Hotkeys** and bind a shortcut to **Selection Translator: Translate selection**.
7. You can also select the left ribbon button before selecting text; it opens the popover and waits for your next Markdown editor or PDF selection.
8. Keep the popover open and select other Markdown editor or PDF text to translate it without opening the command again.

PDF support requires a selectable PDF text layer. Scanned pages without OCR text cannot be translated by selection.

## Manual installation

Download `main.js`, `manifest.json`, and `styles.css` from the latest GitHub release, then copy them to:

```text
<Vault>/.obsidian/plugins/selection-translator/
```

Reload Obsidian and enable the plugin in **Settings -> Community plugins**.

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

## Release

The repository is configured to create a GitHub release when a version tag is pushed. The release workflow builds the plugin and uploads the files BRAT needs.

For the first `1.0.0` release from an already versioned commit:

```bash
git tag 1.0.0
git push origin main --follow-tags
```

For later releases, update the npm package version:

```bash
npm version patch
git push origin main --follow-tags
```

Use the exact tag created by `npm version`. Tags do not use a leading `v`.
