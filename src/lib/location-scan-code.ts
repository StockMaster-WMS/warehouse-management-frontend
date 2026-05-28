const LOCATION_SCAN_PART_COUNT = 4;
const MAX_FULL_LOCATION_BARCODE_LENGTH = 18;

export function normalizeScanText(value?: string | null) {
  return value?.trim().toUpperCase().replace(/\s+/g, "") ?? "";
}

export function compactScanText(value?: string | null) {
  return normalizeScanText(value).replace(/[^A-Z0-9]/g, "");
}

export function scanTextMatches(input: string, expected?: string | null) {
  const normalizedInput = normalizeScanText(input);
  const normalizedExpected = normalizeScanText(expected);
  if (!normalizedInput || !normalizedExpected) return false;
  if (normalizedInput === normalizedExpected) return true;

  const compactInput = compactScanText(normalizedInput);
  const compactExpected = compactScanText(normalizedExpected);
  if (!compactInput || !compactExpected) return false;
  if (compactInput === compactExpected) return true;

  return (
    compactExpected.length >= 6 &&
    compactInput.length >= compactExpected.length &&
    compactInput.includes(compactExpected)
  );
}

export function getLocationScanCode(locationCode?: string | null) {
  const normalized = normalizeScanText(locationCode);
  if (!normalized) return "";
  if (normalized.length <= MAX_FULL_LOCATION_BARCODE_LENGTH) return normalized;

  const parts = normalized.split("-").filter(Boolean);
  if (parts.length <= LOCATION_SCAN_PART_COUNT) return normalized;

  return parts.slice(-LOCATION_SCAN_PART_COUNT).join("-");
}

export function isMatchingLocationScan(input: string, expectedLocationCode: string) {
  const normalizedExpected = normalizeScanText(expectedLocationCode);
  const expectedScanCode = getLocationScanCode(normalizedExpected);

  return (
    scanTextMatches(input, normalizedExpected) ||
    (!!expectedScanCode && scanTextMatches(input, expectedScanCode))
  );
}
