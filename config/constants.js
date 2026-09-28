// Central place for enums used across models & middleware
module.exports = {
  ROLES: {
    VOLUNTEER: 'volunteer',
    NGO: 'ngo',
    DONOR: 'donor',
    ADMIN: 'admin',
  },
  NEED_STATUS: {
    PENDING: 'pending',
    VERIFIED: 'verified',
    IN_PROGRESS: 'in_progress',
    FULFILLED: 'fulfilled',
    REJECTED: 'rejected',
  },
  NEED_CATEGORY: {
    FOOD: 'food',
    MEDICINE: 'medicine',
    SHELTER: 'shelter',
    CLOTHING: 'clothing',
    WATER: 'water',
    OTHER: 'other',
  },
  URGENCY: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical',
  },
  DONATION_TYPE: {
    FUNDS: 'funds',
    ITEMS: 'items',
  },
  DONATION_STATUS: {
    PENDING: 'pending',
    RECEIVED: 'received',
    ALLOCATED: 'allocated',
  },
  CAMP_STATUS: {
    ACTIVE: 'active',
    FULL: 'full',
    CLOSED: 'closed',
  },
  ALERT_SEVERITY: {
    INFO: 'info',
    WARNING: 'warning',
    EMERGENCY: 'emergency',
  },
};
