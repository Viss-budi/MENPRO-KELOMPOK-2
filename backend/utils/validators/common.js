// Nama file gambar, URL http(s), atau path berawalan "/"
const isImageRef = (s) =>
  /^https?:\/\/\S+$/i.test(s) || /^\/[^\s]*$/.test(s) || /^[\w.\-]+\.(webp|png|jpe?g|gif|svg)$/i.test(s);

// "2026/2027": dua tahun yang berurutan
const isPeriod = (s) => {
  if (typeof s !== 'string') return false;
  const m = /^(\d{4})\/(\d{4})$/.exec(s);
  return Boolean(m) && Number(m[2]) === Number(m[1]) + 1;
};

const isBit = (v) => [0, 1, true, false].includes(v);
const isSmallInt = (v) => Number.isInteger(v) && Math.abs(v) <= 1000000;

const PERIOD_MSG = 'period harus berformat YYYY/YYYY dengan tahun berurutan (mis. 2026/2027)';

module.exports = { isImageRef, isPeriod, isBit, isSmallInt, PERIOD_MSG };
