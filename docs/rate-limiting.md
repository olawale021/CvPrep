# User-Based Rate Limiting System

## Overview

This system implements user-based rate limiting with database tracking to manage OpenAI API costs and provide a freemium experience.

## Features

### Free Users
- **7-day free trial** from account creation
- **Daily limits per feature:**
  - Resume creation: 1 per day
  - Resume optimization: 1 per day  
  - Cover letter creation: 1 per day
  - Cover letter optimization: 1 per day
  - Interview preparation: 3 per day

### Premium Users
- **Unlimited access** to all features
- No daily limits

## Database Schema

### Tables
- `user_daily_usage` - Individual user usage tracking
- `feature_analytics` - Global usage statistics
- `users` - User accounts with type field (free/premium)

### Migration
Run the migration file to set up database tables:
```sql
-- File: db/migrations/001_create_usage_tracking_tables.sql
```

## API Endpoints

### Usage Tracking
- `GET /api/user/usage` - Get user's current usage
- `POST /api/admin/analytics` - Admin analytics dashboard

### Implementation
```typescript
// Example usage in API route
import { withFeatureLimit } from '../../../lib/userRateLimit';

export const POST = withFeatureLimit('resume_create', async (req, { user }) => {
  // Your API logic here
  // Rate limiting is handled automatically
});
```

## Components

### UsageTracker
- Displays current usage and limits
- Shows trial status and expiration
- Handles premium vs free user states

### UsageBadge
- Compact usage indicator for sidebar
- Color-coded status (green/yellow/red)

### UsageWarning
- In-context warnings on feature pages
- Trial expiration notices

### LimitExceededDialog
- Modal when limits are reached
- Upgrade prompts and countdown timers

## Environment Detection

The system automatically detects and tracks usage separately for:
- **Production** - Live usage affecting costs
- **Development** - Testing and development usage

## Key Files

```
lib/userRateLimit.ts        # Core rate limiting logic
components/ui/UsageTracker.tsx  # Main usage display
app/api/user/usage/route.ts     # Usage API endpoint
middleware.ts               # Request interceptor
db/migrations/001_*.sql     # Database setup
```

## Setup

1. Run database migration
2. Set up Supabase environment variables
3. Configure user types in your authentication system
4. Add UsageTracker to your dashboard
5. Wrap API endpoints with `withFeatureLimit`

## Security

- Row Level Security (RLS) enabled
- Users can only access their own data
- Admin endpoints require authentication
- Atomic database operations prevent race conditions 