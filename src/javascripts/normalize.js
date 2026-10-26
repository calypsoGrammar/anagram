/**
 * Shared normalisation for search input and dictionary tokens.
 *
 * Rule: Unicode-decompose and drop accents, lower-case, then keep only
 * letters and digits. Case, whitespace, apostrophes, hyphens and other
 * punctuation never count as letters, so "Don't" and "dont" are the same
 * token and a phrase is searched as the letters it contains.
 */
export function normalizeToken(text) {
  return String(text ?? "")
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

export const INPUT_HELP =
  "Case, spaces, punctuation and apostrophes are ignored; only letters and digits are used.";

/** Returns the normalised letters plus a message when input needs explaining. */
export function prepareSearchInput(raw) {
  const letters = normalizeToken(raw);
  const trimmed = String(raw ?? "").trim();
  let message = "";

  if (trimmed.length > 0 && letters.length === 0) {
    message = "No letters found in the input. " + INPUT_HELP;
  } else if (letters.length !== trimmed.length) {
    message = `Searching with the letters "${letters}". ${INPUT_HELP}`;
  }

  return { letters, message };
}
