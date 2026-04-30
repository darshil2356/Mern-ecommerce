/**
 * Validates a shipping address before sending to Shiprocket.
 * Returns { valid: Boolean, errors: String[], warnings: String[] }
 */

const FAKE_PATTERNS = [
  /^(test|fake|dummy|sample|example|temp|abc|xyz|asdf|qwerty|zxcv|aaa|bbb|ccc|na|n\/a|nil|null|none|no|nope|nothing|xxx|yyy|zzz|random|blah|idk|ok|okay|yes|address|home|house)$/i,
  /^(.)\1{3,}$/,      // aaaa, 1111
  /^[0-9]{1,3}$/,     // only 1-3 digits — not a flat number
  /^[a-zA-Z]{1,2}$/,  // single/double letter
];

const KEYBOARD_WALKS = ["qwerty", "asdfgh", "zxcvbn", "qazwsx", "12345", "abcdef"];

const isFake = (value) => {
  if (!value) return true;
  const v = value.trim();
  if (v.length < 2) return true;
  if (FAKE_PATTERNS.some((p) => p.test(v))) return true;
  if (KEYBOARD_WALKS.some((w) => v.toLowerCase().includes(w))) return true;
  const unique = new Set(v.replace(/\s/g, "").toLowerCase()).size;
  if (unique <= 2 && v.replace(/\s/g, "").length >= 5) return true;
  return false;
};

// b204 ✅  B-204 ✅  Flat 3A ✅  Plot 12 ✅  12 ❌  b ❌
const isValidHouseNo = (value) => {
  if (!value || value.trim().length < 4) return false;
  if (isFake(value)) return false;
  const hasDigit = /\d/.test(value);
  const hasKeyword = /(flat|apt|apartment|plot|house|shop|office|floor|wing|block|sector|unit|room|no\.|#)/i.test(value);
  return hasDigit || hasKeyword;
};

// nikol ✅  MG Road ✅  na ❌  ab ❌
const isValidStreet = (value) => {
  if (!value || value.trim().length < 4) return false;
  if (isFake(value)) return false;
  return true;
};

const validateAddress = ({ firstname, address, other, city, state, pincode, phone }) => {
  const errors = [];
  const warnings = [];

  if (!firstname || firstname.trim().length < 2)
    errors.push("Customer name is missing or too short");

  if (!isValidHouseNo(address))
    errors.push("House No./Flat is invalid — enter flat/house no. with a number (e.g. B-204, Flat 3A, Plot 12)");

  if (!isValidStreet(other))
    warnings.push("Street/Area/Colony is missing or invalid — may cause delivery failure");

  if (!city || city.trim().length < 2)
    errors.push("City is missing");

  if (!state || state.trim().length < 2)
    errors.push("State is missing");

  const pin = String(pincode || "").replace(/\D/g, "");
  if (pin.length !== 6 || pin === "000000")
    errors.push(`Invalid pincode: "${pincode}"`);

  const ph = String(phone || "").replace(/\D/g, "");
  if (ph.length !== 10)
    errors.push(`Invalid phone number: "${phone}" (must be 10 digits)`);

  if (phone && /^(\d)\1{9}$/.test(ph))
    warnings.push(`Phone looks like a placeholder: "${phone}"`);

  return { valid: errors.length === 0, errors, warnings };
};

module.exports = validateAddress;
