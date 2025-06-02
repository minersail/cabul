# Supabase Integration Migration Guide

## Overview
This guide outlines the transition from integer-based User IDs to UUID-based Profile IDs compatible with Supabase Auth.

## Schema Changes

### Before (Integer-based)
```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  // ... relations with userid: Int
}
```

### After (UUID-based, Supabase Compatible)
```prisma
model Profile {
  id        String   @id @db.Uuid // Supabase auth.users.id
  email     String   @unique
  // ... relations with profileId: String @db.Uuid
}
```

## Architecture Pattern

### Supabase Auth (`auth.users`) ↔ Your App Profile (`public.profiles`)
- **Supabase manages**: Authentication, email verification, password reset
- **Your app manages**: User preferences, vocabulary data, learning progress

## Usage Pattern

```typescript
// 1. User signs up/logs in via Supabase Auth
const { data: { user } } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password'
});

// 2. Create profile in your database using Supabase user ID
await createUserProfile(user.id, user.email);

// 3. Use profile ID for all vocabulary operations
await addWordToVocabulary(user.id, "bonjour", true);
```

## Benefits of This Approach

✅ **Security**: Leverages Supabase's battle-tested auth system  
✅ **Scalability**: UUID primary keys prevent collision issues  
✅ **Integration**: Works seamlessly with Supabase Row Level Security  
✅ **Flexibility**: Can extend profiles without touching auth schema  

## Row Level Security (RLS) Example

```sql
-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can only access their own profile
CREATE POLICY "Users can view own profile" ON profiles 
  FOR SELECT USING (auth.uid() = id);

-- Users can only update their own profile  
CREATE POLICY "Users can update own profile" ON profiles 
  FOR UPDATE USING (auth.uid() = id);
```

## Migration Steps

1. **Update Schema**: Change User model to Profile with UUID
2. **Regenerate Prisma**: `npx prisma generate`
3. **Update Services**: Modify vocabulary service to use profileId
4. **Update Frontend**: Use Supabase auth.user.id for all operations
5. **Add RLS Policies**: Secure your database with proper access controls

## Automatic Profile Creation

When a user first signs up, automatically create their profile:

```typescript
// In your auth callback/middleware
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' && session?.user) {
    // Check if profile exists, create if not
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', session.user.id)
      .single();
      
    if (!existingProfile) {
      await createUserProfile(session.user.id, session.user.email);
    }
  }
});
``` 