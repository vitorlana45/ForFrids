export function isAdminEmail(email: string | null | undefined) {
  if (!email) return false;
  const raw = process.env.ADMIN_DASHBOARD_EMAILS ?? '';
  const allowed = raw
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.toLowerCase());
}
