const User = require('../models/User');

exports.getAddress = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
    return res.json({ status: 'success', data: user.addressBook || [] });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.addAddress = async (req, res) => {
  try {
    const user = await User.findById(req.body.user);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
    
    if (!user.addressBook) {
      user.addressBook = [];
    }
    
    user.addressBook.push(req.body);
    await user.save();
    
    const newAddress = user.addressBook[user.addressBook.length - 1];
    return res.json({ status: 'success', data: newAddress });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

