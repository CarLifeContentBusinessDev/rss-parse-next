const ADMIN_EMAILS_ENV = process.env.ADMIN_EMAILS ?? '';

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function getAdminEmailSet() {
  return new Set(
    ADMIN_EMAILS_ENV.split(',')
      .map((email) => normalizeEmail(email))
      .filter(Boolean),
  );
}

export function isAdminEmail(email: string | null | undefined) {
  if (!email) return false;
  return getAdminEmailSet().has(normalizeEmail(email));
}

