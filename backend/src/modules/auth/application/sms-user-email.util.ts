export function createSmsPlaceholderEmail(normalizedPhone: string) {
  const digits = normalizedPhone.replace(/\D/g, '');

  return `sms+${digits}@internal.sunrinthon.local`;
}
