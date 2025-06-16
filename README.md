# CvPrep - AI-Powered Resume Optimization

An intelligent resume optimization platform that helps job seekers improve their resumes using AI technology.

## Features

- **AI Resume Analysis**: Advanced resume parsing and optimization using GPT models
- **ATS Compatibility Scoring**: Real-time scoring against job descriptions
- **Professional Templates**: Multiple resume templates optimized for ATS systems
- **Cover Letter Generation**: AI-powered cover letter creation
- **Interview Preparation**: Mock interview practice with AI feedback

## Project Structure

```
components/
  layout/         # Layout components (Sidebar, Headers)
  features/       # Feature-specific components (dashboard, resume, feedback)
  ui/
    base/         # Basic UI components (Button, Input, Card, Badge, etc.)
    composite/    # Composite UI components (Dialog, DropdownMenu, Tabs)
    feedback/     # Feedback components (Toast, LoadingSpinner, ErrorBoundary)
    shadcn/       # ShadCN UI wrappers/extensions
  providers/      # Context and provider components
  admin/          # Admin dashboard components

hooks/
  api/            # API-related hooks (useApi, useSavedResumes, etc.)
  ui/             # UI-related hooks
  features/       # Feature-specific hooks

lib/
  services/
    resume/       # Resume-related services (scoreResume, fileParser, etc.)
    interview/    # Interview-related services
    ...           # Other domain services
  auth/           # Auth utilities (supabaseClient, userRateLimit, etc.)
  api/            # API client and rate limiting
  core/           # Core utilities (logger, cache, utils)

types/
  api/            # API type definitions (savedResume, etc.)
  ui/             # UI type definitions

context/          # React context providers (AuthContext, LoadingContext)
public/           # Static assets
app/              # Next.js app directory (routes, pages)
```

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account (for authentication and database)
- OpenAI API key (for AI features)
- Google OAuth credentials (for authentication)

### Environment Setup

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Configuration
OPENAI_API_KEY=your-openai-api-key

# Application URLs  
NEXTAUTH_URL=https://your-vercel-domain.vercel.app
```

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

## Google OAuth Configuration for Vercel Deployment

If you're experiencing redirect issues where Google OAuth redirects to localhost instead of your Vercel domain, follow these steps:

### 1. Update Environment Variables

Add this to your Vercel environment variables:

```env
NEXTAUTH_URL=https://your-app-name.vercel.app
```

### 2. Configure Google OAuth Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" > "Credentials"
3. Edit your OAuth 2.0 Client ID
4. Add your Vercel domain to "Authorized redirect URIs":
   ```
   https://your-app-name.vercel.app/auth/callback
   ```

### 3. Configure Supabase Auth

1. Go to your Supabase dashboard
2. Navigate to "Authentication" > "Settings"
3. Add your Vercel domain to "Site URL":
   ```
   https://your-app-name.vercel.app
   ```
4. Add your Vercel domain to "Redirect URLs":
   ```
   https://your-app-name.vercel.app/auth/callback
   https://your-app-name.vercel.app/dashboard
   ```

### 4. Deploy to Vercel

```bash
# Deploy to Vercel
vercel --prod
```

After deployment, make sure to update all URLs to use your actual Vercel domain.

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Architecture

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS with custom and ShadCN components
- **Authentication**: Supabase Auth with Google OAuth
- **Database**: Supabase (PostgreSQL)
- **AI Processing**: OpenAI GPT models
- **PDF Generation**: jsPDF with custom templates
- **Deployment**: Vercel

## API Routes

- `/api/resume/analyze` - Resume parsing and analysis
- `/api/resume/score` - ATS compatibility scoring
- `/api/resume/optimize` - AI-powered resume optimization
- `/api/user` - User management operations

```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
