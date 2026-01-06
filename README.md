# Plaid Flash

A lightweight Next.js application for connecting bank accounts using Plaid Link in sandbox mode. Built with Next.js 16 App Router, TypeScript, and the edge-compatible `plaid-fetch` library.

## ✨ Features

- 🚀 Quick Plaid Link integration with sandbox mode
- 🎨 Smooth modal animations and modern UI
- 📊 Pretty-printed JSON display of account data
- ⚡ Edge Runtime compatible with Vercel
- 🔒 Secure token exchange flow
- 📱 Responsive design for mobile and desktop
- 🎓 Educational tool showing Plaid Link callbacks in real-time

## 🎬 Flow

1. Welcome animation fades in
2. "Let's Go" button appears
3. Select a Product, accept Link Token configuration → Plaid Link opens
4. **Link succeeds**: Shows `onSuccess` callback data → Click → Exchange token → Display account data
5. **Link exits**: Shows `onExit` callback data → Click to try again

## 📋 Prerequisites

- Node.js 18+ or higher
- npm or pnpm
- Plaid account with API credentials ([Get started here](https://dashboard.plaid.com/signup))

## 🐳 Docker Quick Start (Recommended)

**No Node.js installation required!** Run the app using Docker in just 3 steps:

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) installed
- [Docker Compose](https://docs.docker.com/compose/install/) installed
- Plaid account with API credentials ([Get started here](https://dashboard.plaid.com/signup))

### Step 1: Get Plaid Credentials

1. Sign up for a free Plaid account at https://dashboard.plaid.com/signup
2. Navigate to Team Settings → Keys
3. Copy your:
   - Client ID
   - Sandbox secret key

### Step 2: Configure Environment Variables

Edit the `docker-compose.yml` file and replace the placeholder values:

```yaml
environment:
  - PLAID_CLIENT_ID=your_actual_client_id_here
  - PLAID_SECRET=your_actual_sandbox_secret_here
  - PLAID_ENV=sandbox
```

### Step 3: Run with Docker Compose

```bash
# Build and start the container
docker-compose up

# Or run in detached mode (background)
docker-compose up -d
```

That's it! Open [http://localhost:3000](http://localhost:3000) in your browser.

### Docker Commands

```bash
# Stop the container
docker-compose down

# Rebuild after code changes
docker-compose up --build

# View logs
docker-compose logs -f

# Stop and remove everything (including volumes)
docker-compose down -v
```

### Alternative: Using Docker directly (without Compose)

```bash
# Build the image
docker build -t plaid-flash .

# Run the container
docker run -p 3000:3000 \
  -e PLAID_CLIENT_ID=your_client_id_here \
  -e PLAID_SECRET=your_sandbox_secret_here \
  -e PLAID_ENV=sandbox \
  plaid-flash
```

### Docker Benefits

✅ No Node.js installation required
✅ Consistent environment across all machines
✅ Isolated dependencies
✅ Production-optimized build (~150-200MB image)
✅ Easy cleanup and removal

### Docker Troubleshooting

**Port already in use:**
```bash
# Change the port in docker-compose.yml
ports:
  - "3001:3000"  # Use port 3001 on host instead
```

**Container won't start:**
```bash
# Check logs
docker-compose logs

# Ensure environment variables are set correctly
docker-compose config
```

**Need to rebuild after changes:**
```bash
docker-compose down
docker-compose up --build
```
## 📁 Project Structure

```
plaid-flash/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Main page (client component)
│   ├── globals.css             # Global styles
│   └── api/
│       ├── create-link-token/
│       │   └── route.ts        # POST /api/create-link-token
│       ├── exchange-public-token/
│       │   └── route.ts        # POST /api/exchange-public-token
│       └── auth-get/
│           └── route.ts        # POST /api/auth-get
├── components/
│   ├── LinkButton.tsx          # Pill-shaped launch button
│   └── Modal.tsx               # Animated modal component
├── .env.local                  # Environment variables (create this)
├── .env.local.example          # Example env file
├── next.config.js              # Next.js configuration
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript configuration
└── vercel.json                 # Vercel deployment config
```

## 🛠 Technologies

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety
- **react-plaid-link** - Official Plaid Link React hook
- **CSS3** - Animations and styling

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **plaid-fetch** - Edge-compatible Plaid API client ([heysanil/plaid-fetch](https://github.com/heysanil/plaid-fetch))

## 🎓 Educational Purpose

Plaid Flash visualizes the Plaid Link integration flow:

1. **Link Token Creation**: See how link tokens are generated server-side
2. **Plaid Link Modal**: Experience the actual Link flow
3. **Callback Inspection**: View `onSuccess` and `onExit` callback data before processing
4. **Token Exchange**: Understand the public → access token flow
5. **API Response**: Inspect the `/auth/get` response data

Perfect for learning, demoing, or debugging Plaid integrations!

## 🧪 Sandbox Test Credentials

Plaid provides various test users for different scenarios: https://plaid.com/docs/sandbox/test-credentials/

## 🔧 Development Notes

- The app uses Plaid's **sandbox environment** for testing
- No database required - tokens are handled in-memory per session
- The `access_token` is removed when starting over the user flow using the buttons on the Plaid Flash UI (intentional for demo purposes)
- For production use, implement proper token storage and security measures

## 🚨 Important: plaid-fetch vs Official SDK

This app uses [`plaid-fetch`](https://github.com/heysanil/plaid-fetch) instead of Plaid's official Node SDK because:

1. **Edge Runtime Compatible** - Works in Vercel Edge Functions
2. **Smaller Bundle** - Uses `fetch` instead of Axios
3. **Response Format** - Returns data directly (no `.data` property)

**Key Difference:**
```typescript
// Official SDK
const response = await plaidClient.linkTokenCreate({...});
const linkToken = response.data.link_token;

// plaid-fetch
const response = await plaid.linkTokenCreate({...});
const linkToken = response.link_token; // No .data property
```

## 🐛 Troubleshooting

### "Failed to initialize" error
- Ensure `.env.local` exists in the root directory
- Verify Plaid credentials are correct
- Check that PLAID_ENV is set to 'sandbox'

### TypeScript errors
- Run `npm install` to ensure all dependencies are installed
- Delete `.next` folder and restart dev server

### Module not found errors
- Ensure you're using the correct import paths (`@/components/...`)
- Check `tsconfig.json` has the correct path mappings

## 📜 License

MIT

## 🙋 Questions?

Check out:
- [Plaid Documentation](https://plaid.com/docs/)
- [Next.js Documentation](https://nextjs.org/docs)
- [plaid-fetch GitHub](https://github.com/heysanil/plaid-fetch)
