/**
 * Calculates estimated reading time based on an average reading speed of 200 words per minute.
 * Time to read = ceil(number of words / 200)
 *
 * @param {string[]|string} paragraphs - Chronicle story paragraphs or text content
 * @returns {number} Reading time in minutes (minimum 1 minute)
 */
export function calculateReadTimeMinutes(paragraphs) {
  if (!paragraphs) return 1;
  const text = Array.isArray(paragraphs) ? paragraphs.join(' ') : String(paragraphs);
  const words = text
    .replace(/[#*`_~[\]()]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  if (words === 0) return 1;
  return Math.max(1, Math.ceil(words / 200));
}
