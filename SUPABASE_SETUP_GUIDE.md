# Supabase Setup Guide for Campus Marketplace

This guide will help you set up the database schema for your campus marketplace app in Supabase.

## 📋 Prerequisites

1. A Supabase account (sign up at [supabase.com](https://supabase.com))
2. A new Supabase project created
3. Access to the Supabase SQL Editor

## 🚀 Setup Steps

### Step 1: Open SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run the Schema

1. Copy the entire contents of `supabase_schema.sql`
2. Paste it into the SQL Editor
3. Click **Run** (or press `Ctrl+Enter` / `Cmd+Enter`)

### Step 3: Verify Tables Created

Run this query to verify tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('items', 'collaborations');
```

You should see both `items` and `collaborations` in the results.

### Step 4: Verify RLS is Enabled

Run this query to check Row Level Security:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('items', 'collaborations');
```

Both tables should show `rowsecurity = true`.

### Step 5: Verify Policies

Check that all policies were created:

```sql
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('items', 'collaborations')
ORDER BY tablename, policyname;
```

You should see:
- **items**: 4 policies (insert, update, delete, select)
- **collaborations**: 4 policies (insert, update, delete, select)

## 🔐 Authentication Setup

### Enable Email Authentication

1. Go to **Authentication** → **Providers** in Supabase dashboard
2. Enable **Email** provider
3. Configure email templates if needed

### Create Test Users

You can create test users through:
1. **Authentication** → **Users** → **Add User** (manual)
2. Or use the signup flow in your app

## 📊 Adding Sample Data

### Get User IDs

First, get the UUIDs of your test users:

```sql
SELECT id, email 
FROM auth.users;
```

### Insert Sample Items

Replace the UUIDs below with actual user IDs:

```sql
-- Replace 'YOUR_USER_ID_1', 'YOUR_USER_ID_2', etc. with actual UUIDs
INSERT INTO items (seller_id, title, description, price, category, contact_info, is_active) VALUES
    ('YOUR_USER_ID_1', 'Physics Notes (Sem1)', 'Handwritten neat notes. 40 pages.', 50.00, 'Study Materials', '9876543210', TRUE),
    ('YOUR_USER_ID_2', 'Charger Type-C', 'Genuine cable, lightly used.', 200.00, 'Electronics', '9876543211', TRUE),
    ('YOUR_USER_ID_3', 'Pocket Calculator', 'Casio-style calculator.', 150.00, 'Electronics', '9876543212', TRUE);
```

### Insert Sample Collaborations

```sql
-- Replace UUIDs with actual user IDs
INSERT INTO collaborations (creator_id, title, category, description, contact_info) VALUES
    ('YOUR_USER_ID_2', 'Need 2 for Hackathon', 'Hackathon', 'Forming a team for InnovEdam. Need 1 dev and 1 designer.', '9876543213'),
    ('YOUR_USER_ID_1', 'Sunday Cricket Match', 'Cricket', 'Casual 7-a-side. Need 3 players, Sunday 4pm.', 'sports@vedam.edu'),
    ('YOUR_USER_ID_3', 'Dance Team for Cultural Fest', 'Dance', 'Looking for 4 dancers and 1 choreographer.', '9876543214');
```

## 🔍 Testing RLS Policies

### Test as Authenticated User

1. Sign in to your app
2. Try to:
   - **Insert** an item → Should work
   - **Read** active items → Should work
   - **Update** your own item → Should work
   - **Delete** your own item → Should work
   - **Update** someone else's item → Should fail
   - **Delete** someone else's item → Should fail

### Test Collaborations

1. Sign in to your app
2. Try to:
   - **Insert** a collaboration → Should work
   - **Read** all collaborations → Should work
   - **Update** your own collaboration → Should work
   - **Delete** your own collaboration → Should work

## 📱 Connecting to Your App

### Get Supabase Credentials

1. Go to **Project Settings** → **API**
2. Copy:
   - **Project URL**
   - **anon/public key**

### Update Your App

In your JavaScript files, initialize Supabase:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'YOUR_PROJECT_URL'
const supabaseAnonKey = 'YOUR_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Example Queries

```javascript
// Get all active items
const { data: items, error } = await supabase
  .from('items')
  .select('*')
  .eq('is_active', true)
  .order('created_at', { ascending: false })

// Create a new item
const { data, error } = await supabase
  .from('items')
  .insert([
    {
      title: 'My Item',
      description: 'Item description',
      price: 100,
      category: 'Electronics',
      seller_id: user.id
    }
  ])

// Get all collaborations
const { data: collabs, error } = await supabase
  .from('collaborations')
  .select('*')
  .order('created_at', { ascending: false })
```

## 🛠️ Troubleshooting

### Issue: "permission denied for table items"

**Solution**: Make sure RLS policies are correctly set up and the user is authenticated.

### Issue: "foreign key constraint fails"

**Solution**: Ensure the `seller_id` or `creator_id` exists in `auth.users` table.

### Issue: Can't see items/collaborations

**Solution**: 
- Check if user is authenticated
- Verify RLS policies are enabled
- Check if items have `is_active = TRUE`

### Issue: Can't insert items

**Solution**: 
- Ensure `seller_id` matches `auth.uid()`
- Verify the user is authenticated
- Check that all required fields are provided

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## ✅ Checklist

- [ ] Schema SQL executed successfully
- [ ] Tables created (`items`, `collaborations`)
- [ ] RLS enabled on both tables
- [ ] All policies created and verified
- [ ] Test users created
- [ ] Sample data inserted
- [ ] RLS policies tested
- [ ] App connected to Supabase
- [ ] CRUD operations working in app

---

**Need Help?** Check the Supabase documentation or community forums for assistance.

