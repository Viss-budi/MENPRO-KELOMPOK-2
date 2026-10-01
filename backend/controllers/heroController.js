const db = require('../config/db');
const { makeCrud } = require('../utils/crud');

const crud = makeCrud({
  table: 'hero_slides',
  fields: ['image_url', 'alt', 'sort_order', 'is_active'],
  required: ['image_url'],
});

const getActive = async (req, res) => {
  const [rows] = await db.query(
    'SELECT id, image_url, alt FROM hero_slides WHERE is_active = 1 ORDER BY sort_order, id'
  );
  res.json({ success: true, data: rows });
};

module.exports = { getActive, ...crud };
