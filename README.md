# AI Content Writer - Auto WordPress Publisher

A modern web application that uses xAI's Grok API to generate high-quality content and automatically publish it to WordPress.

## Features

- **AI-Powered Content Generation**: Use xAI (Grok) to generate SEO-optimized articles
- **Quick Write**: Generate single articles from keywords
- **Batch Processing**: Upload CSV files to generate multiple articles at once
- **Content Library**: Manage all your generated content in one place
- **WordPress Integration**: Automatically publish content to your WordPress site
- **User Authentication**: Secure login and registration system
- **Credential Management**: Securely store your API keys and WordPress credentials

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Authentication**: NextAuth.js v5
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS + Radix UI
- **Deployment**: Vercel

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd autocontentwriterwebapp
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor in your Supabase dashboard
3. Run the SQL script from `supabase-schema.sql` to create the database tables
4. Get your Supabase credentials:
   - Project URL: Settings → API → Project URL
   - Anon Key: Settings → API → Project API keys → anon/public
   - Service Role Key: Settings → API → Project API keys → service_role

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit the `.env` file with your credentials:

```env
# Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

To generate a `NEXTAUTH_SECRET`, run:

```bash
openssl rand -base64 32
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Register and Configure

1. **Register an Account**: Go to `/register` and create an account
2. **Get xAI API Key**:
   - Visit [console.x.ai](https://console.x.ai)
   - Create an account and generate an API key
3. **Configure WordPress**:
   - In your WordPress admin, go to Users → Profile
   - Scroll to "Application Passwords"
   - Create a new application password
4. **Add Credentials**: Go to Settings in the app and add:
   - xAI API Key
   - WordPress Site URL
   - WordPress Username
   - WordPress Application Password

## Usage

### Generate Single Article

1. Go to **Quick Write**
2. Select "Single Keyword"
3. Enter a keyword or topic
4. Click "Generate Content"
5. View the generated content in the Content Library

### Batch Generate Articles

1. Go to **Quick Write**
2. Select "Batch Upload (CSV)"
3. Upload a CSV file with keywords (one per row)
4. Click "Generate All"
5. All generated content will appear in the Content Library

### Publish to WordPress

1. Go to **Content Library**
2. Find the content you want to publish
3. Click "Publish to WordPress"
4. View published content in the **Published** page

## CSV File Format

Your CSV file should have keywords in the first column:

```csv
Benefits of AI in healthcare
How to start a blog in 2024
Best practices for SEO
```

## Deployment to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add the same environment variables from your `.env` file
5. Update `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to your Vercel domain
6. Deploy!

## Project Structure

```
autocontentwriterwebapp/
├── app/
│   ├── (auth)/              # Authentication pages
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/         # Dashboard pages
│   │   ├── quick-write/
│   │   ├── content-library/
│   │   ├── published/
│   │   └── settings/
│   └── api/                 # API routes
│       ├── auth/
│       └── content/
├── components/              # React components
│   ├── ui/                  # UI components
│   └── dashboard/           # Dashboard components
├── lib/                     # Utility functions
│   ├── auth.ts             # NextAuth config
│   ├── supabase.ts         # Supabase client
│   ├── xai.ts              # xAI integration
│   └── wordpress.ts        # WordPress integration
└── types/                   # TypeScript types
```

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) | Yes |
| `NEXTAUTH_URL` | Your app's URL | Yes |
| `NEXTAUTH_SECRET` | Secret for NextAuth.js | Yes |
| `NEXT_PUBLIC_APP_URL` | Your app's public URL | Yes |

## Troubleshooting

### xAI Connection Issues

- Verify your API key is correct
- Check that you have credits in your xAI account
- Ensure you're using the correct endpoint

### WordPress Connection Issues

- Verify your WordPress site has the REST API enabled
- Check that your Application Password is copied correctly (no spaces)
- Ensure your WordPress user has publish permissions

### Database Issues

- Verify Supabase credentials are correct
- Check that Row Level Security (RLS) policies are enabled
- Ensure the database schema is properly set up

## Support

For issues or questions:
- Check the [Issues](https://github.com/yourusername/autocontentwriterwebapp/issues) page
- Review the documentation above
- Contact support

## License

MIT License - feel free to use this project for personal or commercial purposes.
