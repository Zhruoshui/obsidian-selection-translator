export type TranslationTaskStatus =
	| 'waiting'
	| 'processing'
	| 'success'
	| 'fail';

export interface TranslationTask {
	id: string;
	raw: string;
	result: string;
	audio: PronunciationAudio[];
	error: string;
	status: TranslationTaskStatus;
	createdAt: number;
}

export interface PronunciationAudio {
	accent: 'uk' | 'us' | 'other';
	label: string;
	phonetic: string;
	url: string;
}

export interface TranslationResult {
	text: string;
	audio?: PronunciationAudio[];
}

export type TranslationTaskResult = string | TranslationResult;

export function createTranslationTask(raw: string): TranslationTask {
	return {
		id: `translation-${Date.now()}-${Math.random().toString(36).slice(2)}`,
		raw,
		result: '',
		audio: [],
		error: '',
		status: 'waiting',
		createdAt: Date.now(),
	};
}

export function updateTaskProcessing(task: TranslationTask) {
	task.status = 'processing';
	task.result = '';
	task.audio = [];
	task.error = '';
}

export function appendTaskResult(task: TranslationTask, chunk: string) {
	task.result += chunk;
}

export function updateTaskSuccess(
	task: TranslationTask,
	result: TranslationTaskResult,
) {
	task.status = 'success';
	if (typeof result === 'string') {
		task.result = result;
		task.audio = [];
	} else {
		task.result = result.text;
		task.audio = result.audio ?? [];
	}
	task.error = '';
}

export function updateTaskFailure(task: TranslationTask, error: string) {
	task.status = 'fail';
	task.result = '';
	task.audio = [];
	task.error = error;
}
