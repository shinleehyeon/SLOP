export function normalizeStoredText(value: string): string {
  return value.normalize('NFC').trim();
}

export function searchTextForms(value: string): string[] {
  const trimmed = value.trim();

  if (!trimmed) {
    return [];
  }

  const nfc = trimmed.normalize('NFC');
  const nfd = trimmed.normalize('NFD');

  return nfc === nfd ? [nfc] : [nfc, nfd];
}
