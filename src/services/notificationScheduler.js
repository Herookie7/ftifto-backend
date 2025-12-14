const logger = require('../logger');
const {
  checkAndNotifySubscriptionExpiry,
  checkAndNotifyLowTiffins,
  checkAndNotifyLowWalletBalance,
  checkAndSendBirthdayWishes,
  checkAndSendAnniversaryWishes
} = require('./notifications.service');

// Helper to check if it's 9 AM
const isNineAM = () => {
  const now = new Date();
  return now.getHours() === 9 && now.getMinutes() === 0;
};

// Helper to check if it's a new hour
let lastHourChecked = -1;
const isNewHour = () => {
  const now = new Date();
  const currentHour = now.getHours();
  if (currentHour !== lastHourChecked) {
    lastHourChecked = currentHour;
    return true;
  }
  return false;
};

// Track last daily check date
let lastDailyCheckDate = null;
const shouldRunDailyCheck = () => {
  const today = new Date().toDateString();
  if (lastDailyCheckDate !== today && isNineAM()) {
    lastDailyCheckDate = today;
    return true;
  }
  return false;
};

// Schedule daily checks at 9 AM
const scheduleDailyNotifications = () => {
  // Check every minute if it's 9 AM
  const dailyInterval = setInterval(async () => {
    if (shouldRunDailyCheck()) {
      logger.info('Running daily notification checks...');
      
      try {
        // Check subscription expiry (3 days before)
        const expiryResults = await checkAndNotifySubscriptionExpiry();
        logger.info('Subscription expiry notifications sent', { count: expiryResults.length });

        // Check low remaining tiffins
        const tiffinResults = await checkAndNotifyLowTiffins();
        logger.info('Remaining tiffins notifications sent', { count: tiffinResults.length });

        // Check low wallet balance
        const walletResults = await checkAndNotifyLowWalletBalance();
        logger.info('Wallet low balance notifications sent', { count: walletResults.length });

        // Check and send birthday wishes
        const birthdayResults = await checkAndSendBirthdayWishes();
        logger.info('Birthday wishes sent', { count: birthdayResults.length });

        // Check and send anniversary wishes
        const anniversaryResults = await checkAndSendAnniversaryWishes();
        logger.info('Anniversary wishes sent', { count: anniversaryResults.length });

      } catch (error) {
        logger.error('Error in daily notification scheduler', {
          error: error.message,
          stack: error.stack
        });
      }
    }
  }, 60000); // Check every minute

  logger.info('Daily notification scheduler initialized');
  return dailyInterval;
};

// Schedule hourly checks for low balance and remaining tiffins
const scheduleHourlyNotifications = () => {
  // Check every minute if it's a new hour
  const hourlyInterval = setInterval(async () => {
    if (isNewHour()) {
      logger.info('Running hourly notification checks...');
      
      try {
        // Check low remaining tiffins (more frequent)
        const tiffinResults = await checkAndNotifyLowTiffins();
        logger.info('Hourly remaining tiffins notifications sent', { count: tiffinResults.length });

        // Check low wallet balance (more frequent)
        const walletResults = await checkAndNotifyLowWalletBalance();
        logger.info('Hourly wallet low balance notifications sent', { count: walletResults.length });

      } catch (error) {
        logger.error('Error in hourly notification scheduler', {
          error: error.message,
          stack: error.stack
        });
      }
    }
  }, 60000); // Check every minute

  logger.info('Hourly notification scheduler initialized');
  return hourlyInterval;
};

// Initialize all schedulers
let dailyInterval = null;
let hourlyInterval = null;

const initializeNotificationSchedulers = () => {
  dailyInterval = scheduleDailyNotifications();
  hourlyInterval = scheduleHourlyNotifications();
  logger.info('All notification schedulers initialized');
};

const shutdownNotificationSchedulers = () => {
  if (dailyInterval) {
    clearInterval(dailyInterval);
    dailyInterval = null;
  }
  if (hourlyInterval) {
    clearInterval(hourlyInterval);
    hourlyInterval = null;
  }
  logger.info('Notification schedulers shut down');
};

module.exports = {
  initializeNotificationSchedulers,
  shutdownNotificationSchedulers,
  scheduleDailyNotifications,
  scheduleHourlyNotifications
};
