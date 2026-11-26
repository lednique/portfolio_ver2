/**
 * Extracts a safe Behance (or HTTPS) embed iframe URL from either:
 * - full Behance embed HTML snippet: <iframe src="https://www.behance.net/embed/project/..." ...></iframe>
 * - direct embed URL: https://www.behance.net/embed/project/257802213?ilo0=1
 * - regular Behance project URL: https://www.behance.net/gallery/257802213/Project-Name
 */
export function extractBehanceEmbedUrl(rawInput) {
  const text = String(rawInput || '').trim();
  if (!text) return '';

  // 1. Check if user pasted an <iframe ... src="..."> HTML snippet
  const srcMatch = text.match(/src\s*=\s*["']([^"']+)["']/i);
  let candidate = (srcMatch ? srcMatch[1] : text).trim();

  // Decode minimal HTML entities that Behance sometimes includes
  candidate = candidate.replace(/&amp;/gi, '&');

  // 2. Convert regular Behance gallery link to embed link automatically
  const galleryMatch = candidate.match(
    /^https?:\/\/(?:www\.)?behance\.net\/gallery\/(\d+)(?:\/|$|\?)/i
  );
  if (galleryMatch) {
    return `https://www.behance.net/embed/project/${galleryMatch[1]}?ilo0=1`;
  }

  // 3. Convert bare numeric project ID
  if (/^\d{6,12}$/.test(candidate)) {
    return `https://www.behance.net/embed/project/${candidate}?ilo0=1`;
  }

  // 4. Validate safe https/http URL
  if (/^https?:\/\//i.test(candidate)) {
    return candidate;
  }

  return '';
}
