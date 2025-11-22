# Issues & Final Analysis Report
## Complete Analysis of `ftifto-backend/src` Folder

---

## Table of Contents
1. [GraphQL Schema/Resolver Mismatches](#graphql-schemaresolver-mismatches)
2. [Missing Environment Variables](#missing-environment-variables)
3. [Broken Imports](#broken-imports)
4. [Model Usage Analysis](#model-usage-analysis)
5. [Route Usage Analysis](#route-usage-analysis)
6. [Field Name Inconsistencies](#field-name-inconsistencies)
7. [Summary & Recommendations](#summary--recommendations)

---

## GraphQL Schema/Resolver Mismatches

### ✅ **No Missing Resolvers**
All GraphQL queries and mutations defined in the schema have corresponding resolvers implemented.

**Queries with Resolvers:**
- `nearByRestaurants` ✅
- `nearByRestaurantsPreview` ✅
- `restaurant` ✅
- `topRatedVendors` ✅
- `topRatedVendorsPreview` ✅
- `mostOrderedRestaurants` ✅
- `recentOrderRestaurants` ✅
- `popularFoodItems` ✅
- `fetchCategoryDetailsByStoreIdForMobile` ✅
- `configuration` ✅
- `cuisines` ✅
- `myOrders` ✅
- `orders` ✅
- `order` ✅
- `reviewsByRestaurant` ✅
- `taxes` ✅
- `users` ✅
- `rider` ✅
- `userFavourite` ✅

**Mutations with Resolvers:**
- `addFavourite` ✅
- `reviewOrder` ✅
- `selectAddress` ✅
- `updateUser` ✅

### ⚠️ **No GraphQL Subscriptions Defined**
The GraphQL schema does not define any `Subscription` type. If real-time updates are needed via GraphQL, subscriptions should be added.

**Current Real-time Implementation:**
- Real-time updates are handled via Socket.IO (not GraphQL subscriptions)
- Socket.IO namespaces: `/orders` and `/riders`

---

## Missing Environment Variables

### ❌ **Critical Missing Variables**

The following environment variables are referenced in the code but **NOT defined** in `src/config/env.js`:

#### 1. `PRIVACY_EXPORT_PREFIX`
- **Location:** `src/controllers/privacy.controller.js:13`
- **Usage:** `const EXPORT_PREFIX = process.env.PRIVACY_EXPORT_PREFIX || 'privacy-exports/';`
- **Default:** `'privacy-exports/'`
- **Impact:** Low (has default value)
- **Recommendation:** Add to `env.js` for consistency:
  ```javascript
  PRIVACY_EXPORT_PREFIX: process.env.PRIVACY_EXPORT_PREFIX || 'privacy-exports/',
  ```

#### 2. `PRIVACY_EXPORT_TTL_SECONDS`
- **Location:** `src/controllers/privacy.controller.js:14`
- **Usage:** `const EXPORT_TTL_SECONDS = Number(process.env.PRIVACY_EXPORT_TTL_SECONDS) || 3600;`
- **Default:** `3600` (1 hour)
- **Impact:** Low (has default value)
- **Recommendation:** Add to `env.js` for consistency:
  ```javascript
  PRIVACY_EXPORT_TTL_SECONDS: Number(process.env.PRIVACY_EXPORT_TTL_SECONDS) || 3600,
  ```

### ✅ **All Other Environment Variables Properly Defined**
All other `process.env.*` references in the codebase are properly handled in `src/config/env.js` with appropriate defaults.

---

## Broken Imports

### ✅ **All Imports Valid**

#### Verified Import Paths:
1. **`src/controllers/privacy.controller.js:9`**
   - Import: `const { buildS3Client } = require('../../scripts/lib/backupUtils');`
   - **Status:** ✅ Valid - File exists at `ftifto-backend/scripts/lib/backupUtils.js`

2. **All Model Imports:**
   - All `require('../models/*')` imports are valid
   - All 12 models exist and are properly exported

3. **All Service Imports:**
   - All service imports are valid

4. **All Middleware Imports:**
   - All middleware imports are valid

5. **All Utility Imports:**
   - All utility imports are valid

---

## Model Usage Analysis

### ✅ **All Models Are Used**

| Model | Used In | Status |
|-------|---------|--------|
| `User` | Controllers, GraphQL resolvers, Services, Middleware | ✅ Active |
| `Restaurant` | Controllers, GraphQL resolvers | ✅ Active |
| `Product` | Controllers, GraphQL resolvers | ✅ Active |
| `Category` | Controllers, GraphQL resolvers | ✅ Active |
| `Order` | Controllers, GraphQL resolvers, Services | ✅ Active |
| `Review` | GraphQL resolvers | ✅ Active |
| `Configuration` | GraphQL resolvers | ✅ Active |
| `Cuisine` | GraphQL resolvers | ✅ Active |
| `Offer` | GraphQL resolvers | ✅ Active |
| `Section` | GraphQL resolvers | ✅ Active |
| `Zone` | GraphQL resolvers | ✅ Active |
| `PrivacyRequest` | Controllers, Services | ✅ Active |

**Conclusion:** No unused models detected. All 12 models are actively used throughout the codebase.

---

## Route Usage Analysis

### ✅ **All Routes Are Registered**

All route files imported in `src/routes/v1/index.js` are properly registered:

| Route File | Mounted At | Status |
|------------|------------|--------|
| `health.routes` | `/` | ✅ Active |
| `auth.routes` | `/auth` | ✅ Active |
| `user.routes` | `/users` | ✅ Active |
| `order.routes` | `/orders` | ✅ Active |
| `product.routes` | `/products` | ✅ Active |
| `admin.routes` | `/admin` | ✅ Active |
| `seller.routes` | `/seller` | ✅ Active |
| `rider.routes` | `/rider` | ✅ Active |
| `customer.routes` | `/customer` | ✅ Active |
| `version.routes` | `/version` | ✅ Active |
| `payments.routes` | `/payments` | ✅ Active |
| `privacy.routes` | `/privacy` | ✅ Active |
| `restaurantRoutes` | `/` | ✅ Active |
| `categoryRoutes` | `/` | ✅ Active |
| `authRoutes` | `/` | ✅ Active |
| `addressRoutes` | `/` | ✅ Active |

**Note:** Some routes are mounted at root (`/`) which may cause route conflicts. Consider using more specific paths.

**Conclusion:** No unused routes detected. All routes are registered and active.

---

## Field Name Inconsistencies

### ⚠️ **Order Model Field Name Mismatch**

#### Issue: `customer` vs `user` Field Inconsistency

**Problem:**
- The `Order` Mongoose model uses the field name `customer` (line 92 in `src/models/Order.js`)
- The GraphQL schema defines `Order.user: User` (line 244 in `src/graphql/schema.js`)
- GraphQL resolvers populate `user` field, but the model has `customer`

**Locations:**
1. **Model Definition:** `src/models/Order.js:92`
   ```javascript
   customer: {
     type: mongoose.Schema.Types.ObjectId,
     ref: 'User',
     required: true
   }
   ```

2. **GraphQL Schema:** `src/graphql/schema.js:244`
   ```graphql
   type Order {
     user: User  # ← Schema expects 'user'
     ...
   }
   ```

3. **GraphQL Resolvers:** `src/graphql/resolvers.js`
   - Line 364: `.populate('user')`
   - Line 420: `.populate('user')`
   - Line 432: `.populate('user')`
   - Line 512: `user: order.customer` ← Correctly uses `customer` from model

4. **REST Controllers:** Use `customer` correctly
   - `src/controllers/order.controller.js` uses `.populate('customer')`
   - `src/controllers/rider.controller.js` uses `.populate('customer')`
   - `src/controllers/seller.controller.js` uses `.populate('customer')`

**Impact:**
- GraphQL queries for orders will fail when trying to populate `user` field (field doesn't exist on Order model)
- The resolver at line 512 correctly uses `order.customer`, but other resolvers try to populate `user` on Order

**Affected Resolvers:**
- Line 365: `Order.find().populate('user')` ❌ Should be `populate('customer')`
- Line 420: `Order.find().populate('user')` ❌ Should be `populate('customer')`
- Line 432: `Order.findById().populate('user')` ❌ Should be `populate('customer')`
- Line 539: `Order.findById().populate('user')` ❌ Should be `populate('customer')`

**Note:** Lines 52, 162, 194, 376 populate `user` on `Review` model, which is **correct** (Review model has a `user` field).

**Recommendation:**
**Option 1 (Recommended):** Update GraphQL schema to use `customer` instead of `user`:
```graphql
type Order {
  customer: User  # Change from 'user' to 'customer'
  ...
}
```
Then update all Order resolvers to use `.populate('customer')`.

**Option 2:** Update all GraphQL Order resolvers to use `.populate('customer')` instead of `.populate('user')`, and add a field resolver to map `customer` to `user`:
```javascript
Order: {
  user: (parent) => parent.customer
}
```

**Option 3:** Add a virtual field in the Order model to alias `customer` as `user`.

---

## Summary & Recommendations

### ✅ **Strengths**
1. **Complete GraphQL Coverage:** All queries and mutations have resolvers
2. **No Broken Imports:** All import paths are valid
3. **All Models Used:** No dead code in models
4. **All Routes Registered:** No orphaned route files

### ⚠️ **Issues Found**

#### **Critical Issues:**
1. **GraphQL Field Mismatch:** Order model uses `customer` but GraphQL schema/resolvers expect `user`
   - **Severity:** High
   - **Impact:** GraphQL order queries will fail when populating user
   - **Fix Required:** Update schema or resolvers to be consistent

#### **Minor Issues:**
2. **Missing Environment Variables:** `PRIVACY_EXPORT_PREFIX` and `PRIVACY_EXPORT_TTL_SECONDS` not in `env.js`
   - **Severity:** Low
   - **Impact:** Low (has defaults)
   - **Fix Required:** Add to `env.js` for consistency

3. **No GraphQL Subscriptions:** Real-time updates only via Socket.IO
   - **Severity:** Low
   - **Impact:** None (Socket.IO is sufficient)
   - **Fix Required:** Optional - only if GraphQL subscriptions are needed

### 📋 **Action Items**

#### **Priority 1 (High):**
1. ✅ Fix GraphQL `Order.user` vs `Order.customer` field mismatch
   - Update GraphQL schema to use `customer` OR
   - Update GraphQL resolvers to populate `customer` instead of `user`

#### **Priority 2 (Low):**
2. ✅ Add missing environment variables to `env.js`:
   ```javascript
   PRIVACY_EXPORT_PREFIX: process.env.PRIVACY_EXPORT_PREFIX || 'privacy-exports/',
   PRIVACY_EXPORT_TTL_SECONDS: Number(process.env.PRIVACY_EXPORT_TTL_SECONDS) || 3600,
   ```

#### **Priority 3 (Optional):**
3. ✅ Consider adding GraphQL subscriptions if real-time GraphQL is needed
4. ✅ Review route mounting paths to avoid potential conflicts (multiple routes at `/`)

---

## Code Quality Metrics

- **Total Models:** 12 (all used)
- **Total Routes:** 16 (all registered)
- **GraphQL Queries:** 18 (all have resolvers)
- **GraphQL Mutations:** 4 (all have resolvers)
- **GraphQL Subscriptions:** 0 (none defined)
- **Broken Imports:** 0
- **Missing Environment Variables:** 2 (with defaults)
- **Critical Issues:** 1 (field name mismatch)

---

## Conclusion

The codebase is **well-structured** with minimal issues. The main concern is the **field name inconsistency** between the Order model (`customer`) and GraphQL schema (`user`), which needs to be resolved to prevent runtime errors in GraphQL queries.

All other findings are minor and can be addressed during regular maintenance.

