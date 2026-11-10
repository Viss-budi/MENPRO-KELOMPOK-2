// Validasi eksplisit untuk departemen. Mengembalikan [{ field, message }]
const { isImageRef, isPeriod, isBit, isSmallInt, PERIOD_MSG } = require('./common');

module.exports = function validateDepartment(data) {
  const errors = [];
  const add = (field, message) => errors.push({ field, message });
  const has = (f) => data[f] !== undefined;

  if (has('name')) {
    if (typeof data.name !== 'string') add('name', 'Nama departemen harus berupa teks');
    else if (data.name.length > 75) add('name', 'Nama departemen maksimal 75 karakter');
  }
  if (has('description') && data.description !== null) {
    if (typeof data.description !== 'string') add('description', 'Deskripsi harus berupa teks');
    else if (data.description.length > 500) add('description', 'Deskripsi maksimal 500 karakter');
  }
  if (has('logo_url') && data.logo_url !== null) {
    if (typeof data.logo_url !== 'string') add('logo_url', 'logo_url harus berupa teks');
    else if (data.logo_url.length > 500) add('logo_url', 'logo_url maksimal 500 karakter');
    else if (!isImageRef(data.logo_url)) add('logo_url', 'logo_url harus berupa nama file gambar, URL http(s), atau path berawalan "/"');
  }
  if (has('period') && !isPeriod(data.period)) add('period', PERIOD_MSG);
  if (has('sort_order') && !isSmallInt(data.sort_order)) add('sort_order', 'sort_order harus berupa bilangan bulat');
  if (has('is_active') && !isBit(data.is_active)) add('is_active', 'is_active harus 0 atau 1');
  return errors;
};
