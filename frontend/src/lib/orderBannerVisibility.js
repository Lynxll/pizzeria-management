const HIDDEN_PREFIXES = ["/admin", "/courier", "/cook", "/collector", "/login"];

export function shouldHideOrderBanner(pathname) {
  if (!pathname) return true;
  return HIDDEN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function shouldShowOrderBanner(pathname, activeOrder) {
  if (!activeOrder?.id) return false;
  if (shouldHideOrderBanner(pathname)) return false;

  const match = pathname.match(/^\/orders\/(\d+)/);
  if (match && String(activeOrder.id) === match[1]) return false;

  return true;
}
