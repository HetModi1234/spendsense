const express = require('express');
const router = express.Router();
const {
  getGroups,
  createGroup,
  getGroupById,
  inviteMember,
  addSharedExpense,
  getGroupBalances,
  recordSettlement
} = require('../controllers/groupController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const {
  createGroupSchema,
  inviteMemberSchema,
  addSharedExpenseSchema,
  recordSettlementSchema
} = require('../validators/groupValidator');

router.use(protect);

router.get('/', getGroups);
router.post('/', validate(createGroupSchema), createGroup);
router.get('/:id', getGroupById);
router.post('/:id/invite', validate(inviteMemberSchema), inviteMember);
router.post('/:id/expenses', validate(addSharedExpenseSchema), addSharedExpense);
router.get('/:id/balances', getGroupBalances);
router.post('/:id/settlements', validate(recordSettlementSchema), recordSettlement);

module.exports = router;
