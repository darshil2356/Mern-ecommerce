const {
  calculateGrossProfit,
  calculateGrossMargin,
  calculateFromItems,
} = require('./financial');

// Example 1: simple revenue and COGS
const revenue = 120000; // total sales
const cogs = 72000; // cost of goods sold
const gp = calculateGrossProfit(revenue, cogs);
const margin = calculateGrossMargin(revenue, cogs, 2);
console.log('Example 1 - Simple');
console.log('Revenue:', revenue);
console.log('COGS:', cogs);
console.log('Gross Profit:', gp);
console.log('Gross Margin (%):', margin);

// Example 2: from items
const items = [
  { price: 100, cost: 60, quantity: 100 },
  { price: 200, cost: 120, quantity: 50 },
  { price: 50, cost: 30, quantity: 200 },
];
const result = calculateFromItems(items, 2);
console.log('\nExample 2 - From items');
console.log(result);
