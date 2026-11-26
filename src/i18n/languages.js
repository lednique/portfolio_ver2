export const LANGUAGES = [
  { code: 'ru', emoji: '🇷🇺', name: 'Русский', short: 'RU', dir: 'ltr' },
  { code: 'en', emoji: '🇬🇧', name: 'English', short: 'EN', dir: 'ltr' },
  { code: 'zh', emoji: '🇨🇳', name: '中文', short: '中文', dir: 'ltr' },
  { code: 'ja', emoji: '🇯🇵', name: '日本語', short: '日本語', dir: 'ltr' },
  { code: 'pt', emoji: '🇵🇹', name: 'Português', short: 'PT', dir: 'ltr' },
  { code: 'fr', emoji: '🇫🇷', name: 'Français', short: 'FR', dir: 'ltr' },
  { code: 'ar', emoji: '🇸🇦', name: 'العربية', short: 'العربية', dir: 'rtl' },
];

export const LANGUAGE_CODES = LANGUAGES.map((l) => l.code);

export function getLanguageMeta(code) {
  return LANGUAGES.find((l) => l.code === code) || LANGUAGES[0];
}

export function detectInitialLanguage() {
  if (typeof window === 'undefined') return 'ru';
  try {
    const saved = localStorage.getItem('lednique-lang');
    if (saved && LANGUAGE_CODES.includes(saved)) return saved;
  } catch {
    // Ignore storage errors
  }
  try {
    const navLangs = (navigator.languages || [navigator.language || 'ru']).map((x) =>
      String(x).toLowerCase().slice(0, 2)
    );
    const matched = navLangs.find((code) => LANGUAGE_CODES.includes(code));
    if (matched) return matched;
  } catch {
    // Ignore
  }
  return 'ru';
}
