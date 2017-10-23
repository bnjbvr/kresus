const DefaultSettings = new Map();

// Ghost settings: can't be defined by the user, aren't present in exports.
DefaultSettings.set('weboob-installed', 'false');
DefaultSettings.set('standalone-mode', 'false');
DefaultSettings.set('url-prefix', '/');
DefaultSettings.set('emails-enabled', 'false');

// User settings.
DefaultSettings.set('locale', 'en');
DefaultSettings.set('migration-version', '0');
DefaultSettings.set('weboob-auto-update', 'true');
DefaultSettings.set('weboob-auto-merge-accounts', 'true');
DefaultSettings.set('weboob-enable-debug', 'false');
DefaultSettings.set('duplicateThreshold', '24');
DefaultSettings.set('defaultChartDisplayType', 'all');
DefaultSettings.set('defaultChartType', 'all');
DefaultSettings.set('defaultChartPeriod', 'current-month');
DefaultSettings.set('defaultAccountId', '');
DefaultSettings.set('defaultCurrency', 'EUR');
DefaultSettings.set('email-recipient', '');
DefaultSettings.set('theme', 'default');

export default DefaultSettings;
