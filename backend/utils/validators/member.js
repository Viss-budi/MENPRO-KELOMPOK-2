// Validasi eksplisit untuk anggota/pengurus. Mengembalikan [{ field, message }]
const { isImageRef, isPeriod, isBit, isSmallInt, PERIOD_MSG } = require('./common');

module.exports = function validateMember(data) {
  const errors = [];
  const add = (field, message) => errors.push({ field, message });
  const has = (f) => data[f] !== undefined;
  const text = (f, label, max, nullable = false) => {
    if (!has(f) || (nullable && data[f] === null)) return;
    if (typeof data[f] !== 'string') add(f, `${label} harus berupa teks`);
    else if (data[f].length > max) add(f, `${label} maksimal ${max} karakter`);
  };

  text('name', 'Nama', 75);
  text('position', 'Jabatan', 100);
  text('group_name', 'group_name', 50, true);
  if (has('photo_url') && data.photo_url !== null) {
    if (typeof data.photo_url !== 'string') add('photo_url', 'photo_url harus berupa teks');
    else if (data.photo_url.length > 500) add('photo_url', 'photo_url maksimal 500 karakter');
    else if (!isImageRef(data.photo_url)) add('photo_url', 'photo_url harus berupa nama file gambar, URL http(s), atau path berawalan "/"');
  }
  if (has('period') && !isPeriod(data.period)) add('period', PERIOD_MSG);
  if (has('department_id') && data.department_id !== null && !(Number.isInteger(data.department_id) && data.department_id > 0)) {
    add('department_id', 'department_id harus berupa angka bulat positif atau null');
  }
  if (has('sort_order') && !isSmallInt(data.sort_order)) add('sort_order', 'sort_order harus berupa bilangan bulat');
  if (has('is_active') && !isBit(data.is_active)) add('is_active', 'is_active harus 0 atau 1');
  return errors;
};
