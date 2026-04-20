const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/note.controller');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.post(
  '/',
  [
    body('title').isString().trim().isLength({ min: 1, max: 200 }),
    body('description').isString().trim().isLength({ min: 1, max: 5000 }),
  ],
  ctrl.create
);
router.get('/', ctrl.list);
router.delete('/:id', ctrl.remove);

module.exports = router;
