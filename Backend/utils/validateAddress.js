/**
 * Validates a shipping address before sending to Shiprocket.
 * Returns { valid: Boolean, errors: String[], warnings: String[] }
 *
 * Errors   → block shipment creation (critical fields missing/invalid)
 * Warnings → logged but non-blocking (quality issues that may cause RTO)
 */
const validateAddress = ({ firstname, address, city, state, pincode, phone }) => {
  const errors = [];
  const warnings = [];

  // ── Critical checks (block shipment) ──────────────────────────────────────
  if (!firstname || firstname.trim().length < 2)
    errors.push("Customer name is missing or too short");

  if (!address || address.trim().length < 10)
    errors.push(`Address too short (got "${address?.trim()}"): minimum 10 characters`);

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

  // ── Quality warnings (non-blocking) ───────────────────────────────────────
  if (address && address.trim().length < 20)
    warnings.push("Address is very short — may cause delivery issues");

  if (phone && /^(\d)\1{9}$/.test(ph))
    warnings.push(`Phone looks like a placeholder: "${phone}"`);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

module.exports = validateAddress;
