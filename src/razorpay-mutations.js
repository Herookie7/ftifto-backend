    async createRazorpayOrder(_, { amount }, context) {
      if (!context.user) throw new Error('Authentication required');
      
      const Razorpay = require('razorpay');
      const configuration = await Configuration.findOne({});
      
      if (!configuration || !configuration.razorpayKeyId || !configuration.razorpayKeySecret) {
        throw new Error('Razorpay configuration not found');
      }

      const razorpay = new Razorpay({
        key_id: configuration.razorpayKeyId,
        key_secret: configuration.razorpayKeySecret
      });

      // Generate receipt - Razorpay requires receipt to be max 40 characters
      const receipt = `wt_${Date.now()}`; // wt = wallet topup, shorter format
      
      const options = {
        amount: Math.round(amount * 100), // amount in paisa
        currency: configuration.currency || 'INR',
        receipt: receipt.length > 40 ? receipt.substring(0, 40) : receipt,
        payment_capture: 1
      };

      try {
        const order = await razorpay.orders.create(options);
        return {
          id: order.id,
          amount: order.amount,
          currency: order.currency,
          key: configuration.razorpayKeyId
        };
      } catch (error) {
        console.error('Razorpay Order creation error:', error);
        throw new Error(error.message || 'Something went wrong');
      }
    },

    async verifyRazorpayPayment(_, { paymentId, orderId, signature, amount }, context) {
      if (!context.user) throw new Error('Authentication required');

      const crypto = require('crypto');
      const configuration = await Configuration.findOne({});
      
      if (!configuration || !configuration.razorpayKeySecret) {
        throw new Error('Razorpay configuration not found');
      }

      const generated_signature = crypto
        .createHmac('sha256', configuration.razorpayKeySecret)
        .update(orderId + '|' + paymentId)
        .digest('hex');

      if (generated_signature !== signature) {
        throw new Error('Payment verification failed');
      }

      // Payment is verified, update wallet
      const user = await User.findById(context.user._id);
      if (!user) throw new Error('User not found');

      if (!user.customerProfile) {
        user.customerProfile = { currentWalletAmount: 0, totalWalletAmount: 0 };
      }

      const previousBalance = user.customerProfile.currentWalletAmount || 0;
      const newBalance = previousBalance + amount;

      user.customerProfile.currentWalletAmount = newBalance;
      user.customerProfile.totalWalletAmount = (user.customerProfile.totalWalletAmount || 0) + amount;
      
      await user.save();

      // Create transaction record
      const transaction = new WalletTransaction({
        user: user._id,
        amount: amount,
        type: 'CREDIT',
        paymentMethod: 'RAZORPAY',
        paymentId: paymentId,
        orderId: orderId,
        status: 'SUCCESS',
        description: 'Wallet top-up via Razorpay',
        date: new Date()
      });

      await transaction.save();
      return transaction;
    },
