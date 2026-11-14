const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'spendsense_jwt_secret_dev_key_2026',
    { expiresIn: '30d' }
  );
};

// String similarity calculation (Levenshtein distance & ratio) for duplicate detection
const calculateSimilarity = (str1, str2) => {
  if (!str1 || !str2) return 0;
  const s1 = String(str1).toLowerCase().trim();
  const s2 = String(str2).toLowerCase().trim();

  if (s1 === s2) return 1;
  if (s1.includes(s2) || s2.includes(s1)) return 0.85;

  const track = Array(s2.length + 1).fill(null).map(() =>
    Array(s1.length + 1).fill(null)
  );

  for (let i = 0; i <= s1.length; i += 1) track[0][i] = i;
  for (let j = 0; j <= s2.length; j += 1) track[j][0] = j;

  for (let j = 1; j <= s2.length; j += 1) {
    for (let i = 1; i <= s1.length; i += 1) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator
      );
    }
  }

  const distance = track[s2.length][s1.length];
  const maxLen = Math.max(s1.length, s2.length);
  return (maxLen - distance) / maxLen;
};

module.exports = {
  generateToken,
  calculateSimilarity
};
