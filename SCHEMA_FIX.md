# Schema Fix: Admins Table Column Name

## Problem
The RLS policies were referencing `admins.user_id`, but the actual database table uses `id` as the column name.

**Error Message:**
```
column admins.user_id does not exist
```

## Solution Applied

### 1. Updated Admins Table Definition
**Before:**
```sql
CREATE TABLE IF NOT EXISTS admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**After:**
```sql
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Updated RLS Policies

**Admin Notifications Policy:**
```sql
-- Before
EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid())

-- After
EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid())
```

**Partner Insurances Policy:**
```sql
-- Before
EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid())

-- After
EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid())
```

**Admins Self-Access Policy:**
```sql
-- Before
USING (auth.uid() = user_id)

-- After
USING (auth.uid() = id)
```

### 3. Updated useAdmin Hook

**File:** [src/hooks/useAdmin.js](src/hooks/useAdmin.js)

```javascript
// Before
.eq('user_id', currentUser.id)

// After
.eq('id', currentUser.id)
```

## Files Modified

1. ✅ [supabase_schema.sql](supabase_schema.sql) - Table definition and all RLS policies
2. ✅ [src/hooks/useAdmin.js](src/hooks/useAdmin.js) - Query updated

## Testing

After running the updated schema, verify:

1. **Admin notifications** can be managed by admins
2. **Partner insurances** can be managed by admins
3. **Admin role detection** works in `useAdmin` hook

## How to Apply

1. Copy the updated [supabase_schema.sql](supabase_schema.sql)
2. Run it in Supabase SQL Editor
3. The script will automatically:
   - Drop old policies
   - Recreate them with correct column references
   - Fix the admins table structure

---

**Fixed:** January 2026
**Issue:** Column name mismatch in RLS policies
**Status:** ✅ Resolved
