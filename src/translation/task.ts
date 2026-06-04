export type TranslationTaskStatus =
	| 'waiting'
	| 'processing'
	| 'success'
	| 'fail';

export interface TranslationTask {
	id: string;
	raw: string;
	result: string;
	error: string;
	status: TranslationTaskStatus;
	createdAt: number;
}

export function createTranslationTask(raw: string): TranslationTask {
	return {
		id: `translation-${Date.now()}-${Math.random().toString(36).slice(2)}`,
		raw,
		result: '',
		error: '',
		status: 'waiting',
		createdAt: Date.now(),
	};
}

export function updateTaskProcessing(task: TranslationTask) {
	task.status = 'processing';
	task.result = '';
	task.error = '';
}

export function appendTaskResult(task: TranslationTask, chunk: string) {
	task.result += chunk;
}

export function updateTaskSuccess(task: TranslationTask, result: string) {
	task.status = 'success';
	task.result = result;
	task.error = '';
}

export function updateTaskFailure(task: TranslationTask, error: string) {
	task.status = 'fail';
	task.result = '';
	task.error = error;
}
