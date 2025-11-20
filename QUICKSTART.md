# Quick Start Guide

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- An xAI account with API access
- A WordPress site with REST API enabled

## 5-Minute Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase Database

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy your project URL and API keys from Settings → API
3. Open the SQL Editor in Supabase
4. Copy and paste the entire contents of `supabase-schema.sql`
5. Click "Run" to create all tables and policies

### 3. Configure Environment Variables

```bash
# Copy the example file
cp .env.example .env.local

# Edit .env.local with your credentials
```

Your `.env.local` should look like this:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-generated-secret

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Generate `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Register and Configure

1. **Register**: Click "Sign up" and create an account
2. **Login**: Sign in with your credentials
3. **Add API Keys**: Go to Settings and add:
   - xAI API Key (from [console.x.ai](https://console.x.ai))
   - WordPress URL
   - WordPress Username
   - WordPress Application Password

## Getting Your Credentials

### xAI API Key

1. Go to [console.x.ai](https://console.x.ai)
2. Sign up or log in
3. Navigate to API Keys
4. Create a new API key
5. Copy and paste into Settings

### WordPress Application Password

1. Log into your WordPress admin panel
2. Go to Users → Profile (or Users → Your Profile)
3. Scroll down to "Application Passwords"
4. Enter a name (e.g., "AI Content Writer")
5. Click "Add New Application Password"
6. Copy the generated password (it will only be shown once!)
7. Paste into Settings

## First Content Generation

1. Go to **Quick Write**
2. Enter a keyword like "Benefits of AI in healthcare"
3. Click "Generate Content"
4. Wait a few seconds for the AI to generate content
5. View your content in the **Content Library**
6. Click "Publish to WordPress" to publish it

## Batch Processing

1. Create a CSV file with keywords (one per line):

```csv
keyword
Benefits of AI in healthcare
How to start a blog
Best practices for SEO
```

2. Go to **Quick Write** → **Batch Upload**
3. Upload your CSV file
4. Click "Generate All"
5. All content will be generated and saved to the Content Library

## Troubleshooting

### "Please configure your xAI API key"

- Go to Settings and add your xAI API key
- Test the connection using the "Test Connection" button

### "Please configure your WordPress credentials"

- Verify your WordPress URL is correct (include https://)
- Make sure you created an Application Password, not your regular password
- Test the connection using the "Test Connection" button

### Database Connection Issues

- Verify your Supabase credentials in `.env.local`
- Make sure you ran the `supabase-schema.sql` script
- Check that Row Level Security is enabled

## Deployment

Ready to deploy? See [README.md](./README.md) for Vercel deployment instructions.

## Support

- Read the full [README.md](./README.md)
- Check the [supabase-schema.sql](./supabase-schema.sql) if database issues occur
- Ensure all environment variables are set correctly
