# Plaid Flash

A lightweight Next.js application for testing Plaid integrations in sandbox mode. Built with Next.js 16 App Router, TypeScript, and designed to run in Docker for consistent development environments.

## ✨ Features

- 🚀 Quick Plaid Link integration with sandbox mode
- 🎨 Modern UI with smooth animations
- 📊 Real-time JSON display of API responses
- 🔒 Secure token exchange flow
- 📱 Responsive design for mobile and desktop
- 🎓 Educational tool showing Plaid callbacks and API flows
- 🌐 Ngrok webhook tunnel support for localhost testing
- 🔄 CRA product support with legacy user_token compatibility
- 🔑 Alternative credentials toggle for multi-account testing

## 🎬 Flow

1. Welcome animation fades in
2. Select a Product from the catalog
3. Configure settings (optional: webhooks, legacy mode, alt credentials)
4. **Create CRA User** (for CRA products): Configure and create a Plaid user
5. **Review Link Token Config**: Preview the configuration before launching Link
6. **Plaid Link Modal**: Complete the authentication flow
7. **Success**: View callback data and fetch product endpoint results
8. **Webhooks** (optional): Monitor real-time webhook events in the sidebar

## 🐳 Quick Start

Run the app using Docker - no Node.js installation required!

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)
- Install on Mac: `brew install --cask docker-desktop`
- Plaid account with API credentials ([Sign up here](https://dashboard.plaid.com/signup))
- A Plaid Link customization entitled "flash"

### Step 1: Get Plaid Credentials

1. Sign up at [dashboard.plaid.com/signup](https://dashboard.plaid.com/signup)
2. Navigate to **Team Settings → Keys**
3. Copy your **Client ID** and **Sandbox secret**

### Step 2: Configure Environment

Create a `.env` file from the template:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```bash
# App Environment
NODE_ENV=development

# Plaid API Configuration
PLAID_CLIENT_ID=your_client_id_here
PLAID_SECRET=your_sandbox_secret_here
PLAID_ENV=sandbox

# Alternative Plaid Credentials (Optional)
# For testing with multiple Plaid accounts
ALT_PLAID_CLIENT_ID=
ALT_PLAID_SECRET=

# Ngrok Webhook Tunnel (required for CRA and Transactions)
# Get your free token at: https://dashboard.ngrok.com/get-started/your-authtoken
NGROK_AUTHTOKEN=
```

### Step 3: Run with Docker Compose

```bash
# Build and start the container
docker compose up --build

# Or run in detached mode (background)
docker compose up -d
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Docker Commands

```bash
# Stop the container
docker compose down

# Rebuild after code changes
docker compose up --build

# View logs
docker compose logs -f

# Stop and remove everything
docker compose down -v
```

### Docker Benefits

✅ No Node.js installation required  
✅ Consistent development environment  
✅ Runs in true development mode with hot reload  
✅ Includes all dev dependencies (ngrok SDK)  
✅ Easy cleanup and removal  

## ⚙️ Configuration Options

### Ngrok Webhook Tunnel

Enable webhook testing on localhost:

1. Sign up at [ngrok.com](https://ngrok.com)
2. Get your authtoken from [dashboard.ngrok.com/get-started/your-authtoken](https://dashboard.ngrok.com/get-started/your-authtoken)
3. Add to `.env`: `NGROK_AUTHTOKEN=your_token_here`
4. Restart the container

The tunnel starts automatically and provides a public URL for webhook testing.

### Alternative Credentials

Test with multiple Plaid accounts by adding ALT credentials to `.env`:

```bash
ALT_PLAID_CLIENT_ID=your_second_client_id
ALT_PLAID_SECRET=your_second_secret
```

Toggle between accounts in **Settings** without restarting.

### CRA Legacy Mode

For Consumer Report (CRA) products, toggle between:
- **New mode** (default): Uses `user_id` with `identity` object
- **Legacy mode**: Uses `user_token` with `consumer_report_user_identity` object

Access in **Settings** before creating a user.

## 📁 Project Structure

```
plaid-flash/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Main page (client component)
│   ├── globals.css             # Global styles
│   └── api/                    # API routes
│       ├── create-link-token/  # Link token creation
│       ├── user-create/        # CRA user creation
│       ├── exchange-public-token/ # Token exchange
│       ├── cra-*/              # CRA product endpoints
│       ├── webhook/            # Webhook receiver
│       └── ...                 # Product endpoints
├── components/
│   ├── LinkButton.tsx          # Launch button
│   ├── Modal.tsx               # Modal component
│   ├── ProductSelector.tsx     # Product catalog
│   ├── SettingsToggle.tsx      # Settings controls
│   └── WebhookPanel.tsx        # Webhook display
├── lib/
│   ├── ngrokManager.ts         # Ngrok tunnel management
│   ├── productConfig.ts        # Product definitions
│   └── webhookStore.ts         # Webhook state management
├── .env.example                # Environment template
├── docker-compose.yml          # Docker configuration
├── Dockerfile                  # Docker build instructions
└── package.json                # Dependencies
```

## 🛠 Technologies

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety
- **react-plaid-link** - Official Plaid Link React hook
- **CSS3** - Animations and modern styling

### Backend
- **Next.js API Routes** - Serverless endpoints
- **plaid-fetch** - Edge-compatible Plaid client
- **@ngrok/ngrok** - Webhook tunnel SDK

## 🧪 Sandbox Test Credentials

Plaid provides test users for different scenarios:

- Username: `user_good` / Password: `pass_good` - Successful auth
- Username: `user_bad` / Password: `pass_good` - Invalid credentials
- [Full list of test credentials](https://plaid.com/docs/sandbox/test-credentials/)

## 🔧 Development Notes

- Runs in **development mode** for hot reload and debugging
- Uses Plaid's **sandbox environment** (no real data)
- No database required - session-based state
- Tokens are cleared when restarting flows (intentional for testing)
- For production use, implement proper token storage and security

## 🚨 Important: plaid-fetch vs Official SDK

This app uses [`plaid-fetch`](https://github.com/heysanil/plaid-fetch) for better compatibility:

**Benefits:**
- ✅ Works in Edge Runtime (Vercel)
- ✅ Smaller bundle size
- ✅ Uses native `fetch` API

**Response Format Difference:**
```typescript
// Official SDK
const response = await plaidClient.linkTokenCreate({...});
const linkToken = response.data.link_token;

// plaid-fetch
const response = await plaid.linkTokenCreate({...});
const linkToken = response.link_token; // No .data wrapper
```

## 🐛 Troubleshooting

### Container won't start
```bash
# Check logs
docker compose logs

# Verify environment variables
docker compose config

# Ensure .env file exists
ls -la .env
```

### Port already in use
```bash
# Change port in docker-compose.yml
ports:
  - "3001:3000"  # Use 3001 instead
```

### Ngrok tunnel not starting
- Check `NGROK_AUTHTOKEN` is set in `.env`
- Verify token is valid at [dashboard.ngrok.com](https://dashboard.ngrok.com)
- Check Docker logs: `docker compose logs -f`

### Alt credentials not working
- Verify both `ALT_PLAID_CLIENT_ID` and `ALT_PLAID_SECRET` are set
- Create a fresh user after enabling the toggle
- Check logs for credential selection

### Webhook events not appearing
- Ensure ngrok tunnel is running (check logs)
- Verify webhook URL is set in Link Token config
- Check webhook panel is visible in UI

## 📜 License

MIT

## 🔗 Resources

- [Plaid Documentation](https://plaid.com/docs/)
- [Next.js Documentation](https://nextjs.org/docs)
- [plaid-fetch GitHub](https://github.com/heysanil/plaid-fetch)
- [Ngrok Documentation](https://ngrok.com/docs)