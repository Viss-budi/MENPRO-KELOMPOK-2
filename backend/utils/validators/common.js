// Nama file gambar, URL http(s), atau path berawalan "/"
const isImageRef = (s) =>
  /^https?:\/\/\S+$/i.test(s) || /^\/[^\s]*$/.test(s) || /^[\w.\-]+\.(webp|png|jpe?g|gif|svg)$/i.test(s);

const isBit = (v) => [0, 1, true, false].includes(v);
const isSmallInt = (v) => Number.isInteger(v) && Math.abs(v) <= 1000000;

module.exports = { isImageRef, isBit, isSmallInt };
