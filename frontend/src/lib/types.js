/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} email
 * @property {string} full_name
 * @property {string} handle
 * @property {string} [bio]
 * @property {string|null} [avatar_url]
 * @property {Object} subscription
 * @property {'trial'|'starter'|'pro'|'studio'} subscription.plan
 * @property {'trialing'|'active'|'expired'} subscription.status
 * @property {string|null} [subscription.trial_ends_at]
 * @property {string|null} [subscription.current_period_end]
 */

/**
 * @typedef {Object} Project
 * @property {string} id
 * @property {string} name
 * @property {string} [description]
 * @property {'draft'|'in_review'|'approved'|'archived'} status
 * @property {string[]} [tags]
 * @property {Array} [files]
 */

/**
 * @typedef {Object} Conversation
 * @property {string} id
 * @property {'dm'|'project'} type
 * @property {string|null} [name]
 * @property {number} unread_count
 */

export {};