import { Editor, Menu } from 'obsidian';
import { t } from '../i18n';
import type SelectionTranslatorPlugin from '../main';

export function registerSelectionTranslationCommands(
	plugin: SelectionTranslatorPlugin,
) {
	plugin.addCommand({
		id: 'translate-selection',
		name: t('commandTranslateSelection'),
		callback: () => {
			void plugin.translateCurrentSelection();
		},
	});

	plugin.addRibbonIcon('languages', t('commandTranslateSelection'), () => {
		void plugin.openSelectionTranslator();
	});

	plugin.registerEvent(
		plugin.app.workspace.on(
			'editor-menu',
			(menu: Menu, editor: Editor) => {
				if (!editor.getSelection().trim()) {
					return;
				}

				menu.addItem((item) => {
					item.setTitle(t('commandTranslateSelection'))
						.setIcon('languages')
						.onClick(() => {
							void plugin.translateSelection(editor);
						});
				});
			},
		),
	);
}
