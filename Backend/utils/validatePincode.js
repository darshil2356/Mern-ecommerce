const axios = require("axios");

/**
 * Validates an Indian pincode using the free postal API.
 * Also checks if the pincode belongs to the given state.
 *
 * Returns:
 *   { valid: true,  city, state, district }   — pincode exists & state matches
 *   { valid: false, reason }                  — pincode invalid or state mismatch
 */
const validatePincode = async (pincode, state = "") => {
  const pin = String(pincode).replace(/\D/g, "");

  if (pin.length !== 6 || pin === "000000")
    return { valid: false, reason: "Enter a valid 6-digit pincode" };

  try {
    const { data } = await axios.get(
      `https://api.postalpincode.in/pincode/${pin}`,
      { timeout: 5000 }
    );

    const result = data?.[0];

    if (!result || result.Status !== "Success" || !result.PostOffice?.length)
      return { valid: false, reason: `Pincode ${pin} does not exist` };

    const postOffices = result.PostOffice;
    const apiState   = postOffices[0].State || "";
    const district   = postOffices[0].District || "";
    const city       = district || postOffices[0].Name || "";

    // State mismatch check — normalize both sides for comparison
    if (state) {
      const normalize = (s) => s.toLowerCase().replace(/\s+/g, "");
      if (normalize(apiState) !== normalize(state)) {
        return {
          valid: false,
          reason: `Pincode ${pin} belongs to ${apiState}, not ${state}`,
        };
      }
    }

    return { valid: true, city, state: apiState, district };
  } catch (err) {
    // If API is down, don't block the order — just skip validation
    console.warn("[PincodeValidation] API unavailable:", err.message);
    return { valid: true, skipped: true };
  }
};

module.exports = validatePincode;
