// Minimal stub for the `obsidian` module so vitest can resolve imports from
// `src/services/translationService.ts` and `src/settings.ts`. The production
// code paths are not exercised by the unit tests; we only need import
// resolution to succeed and class/function references to be defined.

export const requestUrl = async () => {
	throw new Error('requestUrl is not available in the test environment');
};

export const getLanguage = () => 'en';

export class PluginSettingTab {
	app: unknown;
	plugin: unknown;
	containerEl: HTMLElement;
	constructor(app: unknown, plugin: unknown) {
		this.app = app;
		this.plugin = plugin;
		this.containerEl = { empty: () => undefined };
	}
	display(): void {}
}

export class Setting {
	containerEl: HTMLElement;
	constructor(containerEl: HTMLElement) {
		this.containerEl = containerEl;
	}
	setName(): this {
		return this;
	}
	setDesc(): this {
		return this;
	}
	addText(): this {
		return this;
	}
	addTextArea(): this {
		return this;
	}
	addToggle(): this {
		return this;
	}
	addDropdown(): this {
		return this;
	}
	addButton(): this {
		return this;
	}
}

export class Plugin {
	async loadData(): Promise<unknown> {
		return {};
	}
	async saveData(_data: unknown): Promise<void> {}
	addSettingTab(): void {}
	registerDomEvent(): void {}
}

export class App {}

export class Notice {
	constructor(_message: string) {}
}

export class Editor {}

export const activeDocument = {};

// Keep references so the linter does not flag unused-export warnings.
export const __stub_kept = {
	PluginSettingTab,
	Setting,
	Plugin,
	App,
	Notice,
	Editor,
	activeDocument,
	requestUrl,
	getLanguage,
};
