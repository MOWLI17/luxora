const express = require('express');
const router = express.Router();

router.post('/reset', (req, res) => {
  res.json({ success: true, message: 'Password reset' });
});

module.exports = router;
