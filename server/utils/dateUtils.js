const getCurrentMonthStr = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const getMonthDateRange = (monthStr) => {
  // monthStr is "YYYY-MM"
  const [year, month] = monthStr.split('-').map(Number);
  const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  // Last day of month
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return { startDate, endDate };
};

const getPreviousMonthStr = (monthStr) => {
  const [year, month] = monthStr.split('-').map(Number);
  const prevDate = new Date(Date.UTC(year, month - 2, 1));
  const prevYear = prevDate.getUTCFullYear();
  const prevMonth = String(prevDate.getUTCMonth() + 1).padStart(2, '0');
  return `${prevYear}-${prevMonth}`;
};

const getDaysInMonth = (year, month) => {
  return new Date(year, month, 0).getDate();
};

const getMonthProgress = (monthStr) => {
  const now = new Date();
  const [year, month] = monthStr.split('-').map(Number);
  const totalDays = getDaysInMonth(year, month);

  const isCurrentMonth =
    now.getFullYear() === year && now.getMonth() + 1 === month;

  let elapsedDays;
  if (isCurrentMonth) {
    elapsedDays = Math.max(1, now.getDate());
  } else if (new Date(year, month - 1, 1) < now) {
    elapsedDays = totalDays; // past month
  } else {
    elapsedDays = 0; // future month
  }

  const remainingDays = Math.max(0, totalDays - elapsedDays);

  return {
    totalDays,
    elapsedDays,
    remainingDays,
    isCurrentMonth
  };
};

module.exports = {
  getCurrentMonthStr,
  getMonthDateRange,
  getPreviousMonthStr,
  getDaysInMonth,
  getMonthProgress
};
