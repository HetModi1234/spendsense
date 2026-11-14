const { SUPPORTED_CURRENCIES } = require('../config/constants');

const getCurrencySymbol = (currencyCode = 'INR') => {
  const code = (currencyCode || 'INR').toUpperCase();
  return SUPPORTED_CURRENCIES[code] ? SUPPORTED_CURRENCIES[code].symbol : '₹';
};

const formatCurrency = (amount, currencyCode = 'INR') => {
  const symbol = getCurrencySymbol(currencyCode);
  const formattedNumber = Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return `${symbol}${formattedNumber}`;
};

const roundNumber = (num, decimals = 2) => {
  const factor = Math.pow(10, decimals);
  return Math.round((Number(num) + Number.EPSILON) * factor) / factor;
};

module.exports = {
  getCurrencySymbol,
  formatCurrency,
  roundNumber
};
