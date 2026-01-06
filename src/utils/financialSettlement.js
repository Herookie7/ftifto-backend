/**
 * Financial Settlement Utility
 * 
 * Calculates and updates seller and rider wallet balances when an order is delivered.
 * 
 * @param {Object} order - The Order document
 * @param {Object} restaurant - The Restaurant document (with commissionRate and commissionType)
 * @param {Object} seller - The Seller User document
 * @param {Object} rider - The Rider User document
 * @returns {Object} Settlement details including earnings and commission
 */
async function processFinancialSettlement(order, restaurant, seller, rider) {
  // Validate required data
  if (!order || !restaurant || !seller || !rider) {
    throw new Error('Missing required data for financial settlement');
  }

  // Ensure sellerProfile and riderProfile exist
  if (!seller.sellerProfile) {
    seller.sellerProfile = {
      currentWalletAmount: 0,
      totalWalletAmount: 0,
      withdrawnWalletAmount: 0
    };
  }

  if (!rider.riderProfile) {
    rider.riderProfile = {
      currentWalletAmount: 0,
      totalWalletAmount: 0,
      withdrawnWalletAmount: 0
    };
  }

  // Initialize wallet amounts if undefined
  seller.sellerProfile.currentWalletAmount = seller.sellerProfile.currentWalletAmount || 0;
  seller.sellerProfile.totalWalletAmount = seller.sellerProfile.totalWalletAmount || 0;
  rider.riderProfile.currentWalletAmount = rider.riderProfile.currentWalletAmount || 0;
  rider.riderProfile.totalWalletAmount = rider.riderProfile.totalWalletAmount || 0;

  // Get order amounts with safe defaults
  const orderAmount = Number(order.orderAmount || 0);
  const deliveryCharges = Number(order.deliveryCharges || 0);
  const tipping = Number(order.tipping || 0);
  const taxationAmount = Number(order.taxationAmount || 0);

  // Calculate base amount (order total minus delivery, tip, and tax)
  const baseAmount = orderAmount - deliveryCharges - tipping - taxationAmount;

  // Calculate commission
  const commissionRate = Number(restaurant.commissionRate || 0);
  const commissionType = restaurant.commissionType || 'percentage';

  let commissionAmount = 0;
  if (commissionType === 'percentage') {
    commissionAmount = baseAmount * (commissionRate / 100);
  } else if (commissionType === 'fixed') {
    commissionAmount = commissionRate;
  }

  // Calculate seller earnings (base amount minus commission)
  const sellerEarnings = baseAmount - commissionAmount;

  // Calculate rider earnings (Fixed Fee + Tip)
  // Fallback to deliveryCharges if riderFee is missing (backward compatibility)
  const riderFee = (typeof order.riderFee === 'number') ? order.riderFee : deliveryCharges;
  const riderEarnings = riderFee + tipping;

  // Update seller wallet
  seller.sellerProfile.currentWalletAmount += sellerEarnings;
  seller.sellerProfile.totalWalletAmount += sellerEarnings;

  // Update rider wallet
  rider.riderProfile.currentWalletAmount += riderEarnings;
  rider.riderProfile.totalWalletAmount += riderEarnings;

  // Save both user documents
  await Promise.all([
    seller.save(),
    rider.save()
  ]);

  // Return settlement details
  return {
    sellerEarnings,
    riderEarnings,
    commissionAmount,
    baseAmount,
    orderAmount,
    deliveryCharges,
    tipping,
    taxationAmount,
    commissionRate,
    commissionType
  };
}

module.exports = {
  processFinancialSettlement
};

