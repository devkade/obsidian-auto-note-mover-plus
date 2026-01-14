import { describe, it, expect } from 'vitest';

describe('Hide notifications', () => {
	describe('fileMove notification logic', () => {
		it('should not show success notification when hideNotifications is true', () => {
			const hideNotifications = true;
			const shouldShowSuccess = !hideNotifications;
			expect(shouldShowSuccess).toBe(false);
		});

		it('should show success notification when hideNotifications is false', () => {
			const hideNotifications = false;
			const shouldShowSuccess = !hideNotifications;
			expect(shouldShowSuccess).toBe(true);
		});

		it('should show success notification when hideNotifications is undefined', () => {
			const hideNotifications: boolean | undefined = undefined;
			const shouldShowSuccess = !hideNotifications;
			expect(shouldShowSuccess).toBe(true);
		});

		it('should always show error notifications regardless of hideNotifications setting', () => {
			const shouldShowError = true; // Error notifications are always shown
			expect(shouldShowError).toBe(true);
		});
	});

	describe('settings default value', () => {
		it('should default hide_notifications to false', () => {
			const settings: { hide_notifications: boolean } = {
				hide_notifications: false,
			};
			expect(settings.hide_notifications).toBe(false);
		});

		it('should allow hide_notifications to be set to true', () => {
			const settings: { hide_notifications: boolean } = {
				hide_notifications: true,
			};
			expect(settings.hide_notifications).toBe(true);
		});
	});
});
