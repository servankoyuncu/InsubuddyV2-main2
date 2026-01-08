# Supabase Migration Checklist

## ✅ Completed Steps

All service files have been successfully converted from Firebase to Supabase:

- ✅ [supabase.js](src/supabase.js) - Supabase client with error handling
- ✅ [AuthContext.jsx](src/context/AuthContext.jsx) - Authentication provider
- ✅ [Login.jsx](src/pages/Login.jsx) - Login page
- ✅ [Register.jsx](src/pages/Register.jsx) - Registration page
- ✅ [policyservice.jsx](src/services/policyservice.jsx) - Policy CRUD operations
- ✅ [financialService.js](src/services/financialService.js) - Financial calculations
- ✅ [budgetService.js](src/services/budgetService.js) - Budget management
- ✅ [valuableItemsService.js](src/services/valuableItemsService.js) - Valuable items with image compression
- ✅ [notificationService.js](src/services/notificationService.js) - User notification settings
- ✅ [adminNotificationService.js](src/services/adminNotificationService.js) - Admin notifications with real-time updates
- ✅ [useAdmin.js](src/hooks/useAdmin.js) - Admin role checking hook

## 🔧 Required Setup Steps

### Step 1: Configure Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project or select existing one
3. Copy your project credentials:
   - **Project URL**: Found in Settings > API
   - **Anon Key**: Found in Settings > API (public anon key)

### Step 2: Update Environment Variables

Open the [.env](.env) file in your project root and add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

⚠️ **Important**: Never commit the `.env` file to Git! It's already in `.gitignore`.

### Step 3: Create Database Schema

1. In your Supabase Dashboard, go to **SQL Editor**
2. Open the [supabase_schema.sql](supabase_schema.sql) file
3. Copy the entire contents
4. Paste into the SQL Editor
5. Click **Run** to create all tables and Row Level Security policies

⚠️ **Note**: This script is idempotent (can be run multiple times safely). It uses `DROP POLICY IF EXISTS` and `DROP TRIGGER IF EXISTS` to avoid duplicate errors.

This will create:
- `policies` - Insurance policies
- `valuable_items` - User valuables with images
- `user_settings` - User preferences and notification settings
- `admin_notifications` - System-wide notifications
- `partner_insurances` - Partner insurance offerings
- `admins` - Admin user roles
- `financial_snapshots` - Monthly financial history
- `budgets` - User budget limits

### Step 4: Enable Authentication Providers

1. Go to **Authentication > Providers** in Supabase Dashboard
2. Enable **Email** provider (should be enabled by default)
3. Enable **Google** OAuth provider:
   - Follow Supabase guide to create Google OAuth credentials
   - Add your redirect URLs:
     - Development: `http://localhost:5173`
     - Production: Your deployed URL

### Step 5: Migrate Existing Data (Optional)

If you have existing Firebase data, you'll need to migrate it:

**Option A: Manual Migration**
1. Export data from Firebase Console
2. Transform to match Supabase schema (snake_case columns)
3. Import via Supabase Dashboard or SQL

**Option B: Start Fresh**
- Simply start using the app with Supabase
- Old Firebase data remains accessible but won't be used

### Step 6: Remove Firebase Dependencies (After Testing)

Once Supabase is confirmed working:

1. Remove Firebase config:
```bash
npm uninstall firebase
```

2. Delete these files:
   - `src/firebase.js` or `src/firebase.jsx`
   - Any remaining Firebase import references

3. Clean up imports in components that might still reference Firebase

### Step 7: Test All Features

Use this testing checklist:

**Authentication**
- [ ] User registration (email/password)
- [ ] User login (email/password)
- [ ] Google OAuth login
- [ ] Password reset flow
- [ ] Logout

**Policies**
- [ ] Add new policy
- [ ] View all policies
- [ ] Update policy
- [ ] Delete policy
- [ ] Upload policy documents

**Financial Dashboard**
- [ ] View monthly/annual totals
- [ ] View expense breakdown chart
- [ ] View historical trend chart
- [ ] View savings recommendations
- [ ] Set budget limits
- [ ] Update budget

**Valuable Items**
- [ ] Add item with image
- [ ] View all items
- [ ] Delete item
- [ ] Image compression working

**Notifications**
- [ ] Save notification settings
- [ ] Load notification settings
- [ ] Expiring policy alerts
- [ ] Admin notifications display

**Admin Features** (if applicable)
- [ ] Admin role detection
- [ ] Create admin notification
- [ ] Update admin notification
- [ ] Delete admin notification
- [ ] Real-time notification updates

## 🔑 Key Differences from Firebase

### Authentication
- Firebase: `currentUser.uid`
- Supabase: `currentUser.id`

### Data Format
- **Database**: snake_case (e.g., `user_id`, `monthly_limit`)
- **React**: camelCase (e.g., `userId`, `monthlyLimit`)
- All services include transformation layer

### Real-time Updates
- Firebase: `onSnapshot()`
- Supabase: `.channel().on('postgres_changes')`
- Example in `adminNotificationService.js`

### Timestamps
- Firebase: `serverTimestamp()`
- Supabase: `new Date().toISOString()` or let database handle with `DEFAULT NOW()`

## 🐛 Troubleshooting

### "Invalid API key" Error
- Check `.env` file has correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Restart dev server after changing `.env`

### "Row Level Security Policy Violation"
- Ensure you ran the complete `supabase_schema.sql`
- Check RLS policies in Supabase Dashboard under Authentication > Policies
- Verify user is authenticated before CRUD operations

### "PGRST116" Error
- This means "row not found" - it's expected for first-time users
- Code already handles this gracefully (see `error.code !== 'PGRST116'` checks)

### Data Not Appearing
- Check browser console for errors
- Verify table names match schema (snake_case)
- Ensure RLS policies allow SELECT for authenticated users

### Google OAuth Not Working
- Verify redirect URLs are correct in Google Console
- Check Supabase Auth settings have Google enabled
- Ensure `window.location.origin` is whitelisted

## 📋 Migration Summary

**Total Files Converted**: 11
**New Files Created**: 2 (supabase.js, supabase_schema.sql)
**Database Tables**: 8
**Backward Compatibility**: ✅ Maintained (camelCase format in React)
**RLS Security**: ✅ Enabled on all tables
**Real-time Support**: ✅ Ready (admin notifications)

## 🚀 Deployment Notes

When deploying to production:

1. **Update Environment Variables** in your hosting platform:
   - Vercel/Netlify: Add in dashboard
   - Capacitor (Android/iOS): Update during build

2. **Update OAuth Redirect URLs**:
   - Add production URL to Supabase Auth settings
   - Add to Google OAuth console

3. **Test on Production**:
   - Create test account
   - Verify all features work
   - Check console for errors

## 📞 Support

If you encounter issues:
1. Check Supabase Dashboard > Logs for database errors
2. Check browser console for client errors
3. Verify `.env` variables are correct
4. Ensure database schema is fully applied

---

**Migration completed**: January 2026
**Database**: Supabase Postgres with RLS
**Authentication**: Supabase Auth (Email + Google OAuth)
**Framework**: React 18 + Vite + Capacitor
