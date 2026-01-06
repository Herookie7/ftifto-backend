/**
 * Franchise Scoping Middleware
 * 
 * This middleware provides helper functions to scope database queries
 * based on the user's franchise assignment and role.
 * 
 * - Super Admins: See all data across all franchises
 * - Franchise Admins: Only see data from their assigned franchise
 * - Regular Users: No franchise filtering
 */

/**
 * Adds franchise scope to query based on user's role and franchise assignment
 * @param {Object} context - GraphQL context containing authenticated user
 * @returns {Object} Query filter object to merge with existing query
 */
const addFranchiseScope = (context) => {
    if (!context || !context.user) {
        return {};
    }

    const { user } = context;

    // Super admins can see all data
    if (user.role === 'super-admin') {
        return {};
    }

    // Franchise admins only see their franchise data
    if (user.role === 'franchise-admin' && user.franchise) {
        return { franchise: user.franchise };
    }

    // Regular users (customer, seller, rider, admin) - no franchise filtering
    return {};
};

/**
 * Checks if user has permission to access data from a specific franchise
 * @param {Object} context - GraphQL context containing authenticated user
 * @param {String} franchiseId - The franchise ID to check access for
 * @returns {Boolean} True if user can access this franchise
 */
const canAccessFranchise = (context, franchiseId) => {
    if (!context || !context.user) {
        return false;
    }

    const { user } = context;

    // Super admins can access any franchise
    if (user.role === 'super-admin') {
        return true;
    }

    // Franchise admins can only access their own franchise
    if (user.role === 'franchise-admin' && user.franchise) {
        return user.franchise.toString() === franchiseId.toString();
    }

    // Regular admins can access any franchise
    if (user.role === 'admin') {
        return true;
    }

    return false;
};

/**
 * Gets the franchise ID to use when creating new records
 * @param {Object} context - GraphQL context containing authenticated user
 * @returns {String|null} Franchise ID or null
 */
const getFranchiseForCreation = (context) => {
    if (!context || !context.user) {
        return null;
    }

    const { user } = context;

    // Franchise admins create records in their franchise
    if (user.role === 'franchise-admin' && user.franchise) {
        return user.franchise;
    }

    // Super admins and regular admins can specify franchise
    // or leave it null for assignment later
    return null;
};

/**
 * Validates that a user can perform an action on a resource
 * @param {Object} context - GraphQL context
 * @param {Object} resource - The resource being accessed (must have franchise field)
 * @param {String} action - The action being performed (e.g., 'read', 'update', 'delete')
 * @throws {Error} If user doesn't have permission
 */
const validateFranchiseAccess = (context, resource, action = 'access') => {
    if (!resource) {
        throw new Error('Resource not found');
    }

    if (!context || !context.user) {
        throw new Error('Authentication required');
    }

    const { user } = context;

    // Super admins can do anything
    if (user.role === 'super-admin') {
        return true;
    }

    // Franchise admins can only access their franchise resources
    if (user.role === 'franchise-admin') {
        if (!user.franchise) {
            throw new Error('User is not assigned to a franchise');
        }

        if (!resource.franchise) {
            // Resource doesn't have franchise assignment - might be old data
            // Allow access but log warning
            console.warn(`Resource ${resource._id} has no franchise assignment`);
            return true;
        }

        if (resource.franchise.toString() !== user.franchise.toString()) {
            throw new Error(`You don't have permission to ${action} this resource`);
        }
    }

    return true;
};

/**
 * Validates that two entities belong to the same franchise
 * Throws error if franchise-admin tries to use cross-franchise resources
 * @param {Object} context - GraphQL context
 * @param {Object} entity1 - First entity with franchise field
 * @param {Object} entity2 - Second entity with franchise field
 * @param {String} errorMessage - Custom error message
 * @throws {Error} If franchise mismatch for franchise-admin
 */
const validateFranchiseMatch = (context, entity1, entity2, errorMessage = 'Cross-franchise operation not allowed') => {
    if (!context || !context.user) {
        throw new Error('Authentication required');
    }

    const { user } = context;

    // Super admins can do anything
    if (user.role === 'super-admin') {
        return true;
    }

    // Franchise admins can only work within their franchise
    if (user.role === 'franchise-admin') {
        if (!user.franchise) {
            throw new Error('User is not assigned to a franchise');
        }

        const franchise1 = entity1?.franchise?.toString() || entity1?.franchise;
        const franchise2 = entity2?.franchise?.toString() || entity2?.franchise;

        if (franchise1 && franchise2 && franchise1 !== franchise2) {
            throw new Error(errorMessage);
        }

        // Also validate against user's own franchise
        if (franchise1 && franchise1 !== user.franchise.toString()) {
            throw new Error(errorMessage);
        }
        if (franchise2 && franchise2 !== user.franchise.toString()) {
            throw new Error(errorMessage);
        }
    }

    return true;
};

module.exports = {
    addFranchiseScope,
    canAccessFranchise,
    getFranchiseForCreation,
    validateFranchiseAccess,
    validateFranchiseMatch
};
