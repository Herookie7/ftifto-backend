const User = require('../models/User');

exports.register = async (req, res) => {
  try {
    const exists = await User.findOne({ email: req.body.email });
    if (exists) {
      return res.status(400).json({ status: 'error', message: 'Email already exists' });
    }
    const user = await User.create(req.body);
    return res.json({ status: 'success', data: user });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
    return res.json({ status: 'success', data: user });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

