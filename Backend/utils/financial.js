/**
 * Financial helpers for gross profit and margin calculations.
 *
 * Exports:
 * - calculateGrossProfit(revenue, cogs)
 * - calculateGrossMargin(revenue, cogs, decimals=2)
 * - calculateFromItems(items, decimals=2)
 *
 * `items` format: [{ price, cost, quantity? }]
 */

'use strict';

function toNumber(v) {
  if (v == null || v === '') return 0;
  // If value is an object like mongoose Decimal128, call toString()
  let s;
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (typeof v === 'string') s = v;
  else if (v && typeof v.toString === 'function') s = v.toString();
  else s = String(v);

  // Remove common non-numeric characters (commas, currency symbols, spaces, percent signs)
  // Keep digits, minus sign and dot.
  s = s.replace(/[^0-9.\-]/g, '');

  if (s === '' || s === '-' || s === '.' || s === '-.') return 0;
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function sumArray(arr) {
  return arr.reduce((s, x) => s + toNumber(x), 0);
}

function calculateGrossProfit(revenue, cogs) {
  const r = toNumber(revenue);
  const c = toNumber(cogs);
  return r - c;
}

function calculateGrossMargin(revenue, cogs, decimals = 2) {
  const r = toNumber(revenue);
  if (r === 0) return 0;
  const gp = calculateGrossProfit(r, cogs);
  const margin = (gp / r) * 100;
  const factor = Math.pow(10, decimals);
  return Math.round(margin * factor) / factor;
}

/**
 * Calculate totals from an items array.
 * Each item: { price, cost, quantity }
 */
function calculateFromItems(items, decimals = 2) {
  if (!Array.isArray(items)) {
    throw new TypeError('items must be an array');
  }
  let totalRevenue = 0;
  let totalCogs = 0;
  for (const it of items) {
    const qty = toNumber(it.quantity || 1);
    const price = toNumber(it.price || 0);
    const cost = toNumber(it.cost || 0);
    totalRevenue += price * qty;
    totalCogs += cost * qty;
  }
  const gp = calculateGrossProfit(totalRevenue, totalCogs);
  const margin = calculateGrossMargin(totalRevenue, totalCogs, decimals);
  return {
    revenue: totalRevenue,
    cogs: totalCogs,
    grossProfit: gp,
    grossMarginPercent: margin,
  };
}

module.exports = {
  calculateGrossProfit,
  calculateGrossMargin,
  calculateFromItems,
};
