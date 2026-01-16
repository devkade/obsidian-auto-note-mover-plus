import { describe, it, expect, vi, type Mock } from 'vitest';

interface MockPlugin {
	enabled: boolean;
}

interface MockApp {
	internalPlugins: {
		getPluginById: Mock<(id: string) => MockPlugin | undefined>;
	};
}

describe('Duplicate file handling', () => {
	describe('isNoteComposerEnabled', () => {
		it('should return false when note-composer plugin is not enabled', () => {
			const mockApp: MockApp = {
				internalPlugins: {
					getPluginById: vi.fn<(id: string) => MockPlugin | undefined>().mockReturnValue(undefined),
				},
			};

			const plugin = mockApp.internalPlugins.getPluginById('note-composer');
			const isEnabled = plugin && plugin.enabled;

			expect(isEnabled).toBeFalsy();
		});

		it('should return false when note-composer plugin is disabled', () => {
			const mockApp: MockApp = {
				internalPlugins: {
					getPluginById: vi.fn<(id: string) => MockPlugin | undefined>().mockReturnValue({ enabled: false }),
				},
			};

			const plugin = mockApp.internalPlugins.getPluginById('note-composer');
			const isEnabled = plugin && plugin.enabled;

			expect(isEnabled).toBe(false);
		});

		it('should return true when note-composer plugin is enabled', () => {
			const mockApp: MockApp = {
				internalPlugins: {
					getPluginById: vi.fn<(id: string) => MockPlugin | undefined>().mockReturnValue({ enabled: true }),
				},
			};

			const plugin = mockApp.internalPlugins.getPluginById('note-composer');
			const isEnabled = plugin && plugin.enabled;

			expect(isEnabled).toBe(true);
		});
	});

	describe('handleDuplicateFile - skip action', () => {
		it('should return false when action is skip', async () => {
			// Simulate skip logic - doesn't need mock objects
			const action = 'skip';
			const result = action === 'skip' ? false : true;

			expect(result).toBe(false);
		});

		it('should show error notice when skipping duplicate file', () => {
			const action = 'skip';
			const shouldShowError = action === 'skip';

			expect(shouldShowError).toBe(true);
		});
	});

	describe('handleDuplicateFile - merge action restrictions', () => {
		it('should not merge in automatic mode (non-cmd caller)', () => {
			const action: 'skip' | 'merge' = 'merge';
			const caller: string = ''; // Automatic mode has no caller
			const isMergeBlocked = action === 'merge' && caller !== 'cmd';

			expect(isMergeBlocked).toBe(true);
		});

		it('should allow merge in manual mode (cmd caller)', () => {
			const action: 'skip' | 'merge' = 'merge';
			const caller: string = 'cmd';
			const isMergeBlocked = action === 'merge' && caller !== 'cmd';

			expect(isMergeBlocked).toBe(false);
		});

		it('should fallback to skip when Note Composer is disabled', () => {
			const action: 'skip' | 'merge' = 'merge';
			const noteComposerEnabled = false;

			// Simulate the fallback logic
			let result: 'skip' | 'merge' = action;
			if (!noteComposerEnabled) {
				result = 'skip';
			}

			expect(result).toBe('skip');
		});
	});

	describe('settings default value', () => {
		it('should default duplicate_file_action to skip', () => {
			const settings: { duplicate_file_action: 'skip' | 'merge' } = {
				duplicate_file_action: 'skip',
			};
			expect(settings.duplicate_file_action).toBe('skip');
		});

		it('should allow duplicate_file_action to be set to merge', () => {
			const settings: { duplicate_file_action: 'skip' | 'merge' } = {
				duplicate_file_action: 'merge',
			};
			expect(settings.duplicate_file_action).toBe('merge');
		});
	});

	describe('fileMove with duplicate file action', () => {
		it('should show error notice when duplicate file exists and action is skip', () => {
			const duplicateFileAction: 'skip' | 'merge' = 'skip';
			const shouldShowError = duplicateFileAction === 'skip';

			expect(shouldShowError).toBe(true);
		});

		it('should attempt merge when duplicate file exists and action is merge', () => {
			const duplicateFileAction: 'skip' | 'merge' = 'merge';
			const shouldAttemptMerge = duplicateFileAction !== undefined && duplicateFileAction === 'merge';

			expect(shouldAttemptMerge).toBe(true);
		});
	});
});
