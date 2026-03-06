// Pre-initialize all of expo's lazy globals to prevent "import outside scope" errors.
// Expo SDK 54 uses lazy getters (via installGlobal) that fire on first access.
// If they fire after Jest teardown, Jest throws ReferenceError.
// Force-accessing them here ensures they resolve during setup phase.

const lazyGlobals = [
  "TextDecoder",
  "TextDecoderStream",
  "TextEncoderStream",
  "URL",
  "URLSearchParams",
  "__ExpoImportMetaRegistry",
  "structuredClone",
];

for (const name of lazyGlobals) {
  try {
    void globalThis[name];
  } catch {
    // Silently ignore if not available
  }
}
