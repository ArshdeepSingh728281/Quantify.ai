# Quantify.ai

Quantify.ai is an AI-assisted stock research and technical-analysis platform. It brings stock charts, technical indicators, and an AI analyst into one place so users can explore market data and understand it in plain language.

The goal is to make quantitative and technical analysis easier to approach, including for people who are new to trading. The platform is a research and learning tool; its analysis is not a guarantee of future performance or a promise of profit.

## What the project does

Depending on the features enabled in your current version, Quantify.ai can help users:

- **Explore stocks:** Find a stock and open its analysis page.
- **View market charts:** Inspect price movement and historical candles.
- **Ask the AI analyst questions:** Ask questions in everyday language instead of needing to know every technical term.
- **Use technical-analysis tools:** Request analysis such as trend, RSI, and support/resistance when those tools are available.
- **Understand risk:** Ask the AI to discuss possible risks and explain its reasoning.
- **Explore strategies:** Ask for strategy ideas and backtesting where supported by the current implementation.
- **Choose an analysis style:** Use the available trading mode and risk settings to guide the analysis.
- **Sign in with Google:** Authenticate users before accessing features that require an account.
- **Save information:** Use MongoDB-backed storage for supported application data, such as chat or analysis records.

Some capabilities depend on API credentials and on which routes/tools are implemented in your checkout. This README describes the intended application and setup; it does not imply that every feature is enabled in every deployment.

## How to use Quantify.ai

1. Open the application in your browser.
2. Browse the dashboard and available stocks.
3. Sign in with Google if prompted.
4. Select a stock to open its analysis page.
5. Review its chart and the information displayed by the application.
6. Choose the available trading mode and risk preference, if shown.
7. Ask the AI analyst a question, or select one of the suggested questions.
8. Read the explanation as research information. Check important figures and assumptions before making any financial decision.

## How it works (plain-language overview)

1. **The website** displays the dashboard, stock information, charts, and AI chat.
2. **The server** receives requests from the website and coordinates data fetching, analysis tools, authentication, and storage.
3. **Market data** is requested through the configured market-data provider (Upstox in this setup).
4. **The AI service** interprets the user's question and can use the analysis tools made available to it.
5. **Analysis tools** calculate or retrieve specific information, such as trend or RSI, instead of relying only on a general AI response.
6. **MongoDB** stores supported application records so the application can retrieve them later.
7. **Google authentication** lets users sign in without the application managing their Google password.

The AI can make mistakes, and market data may be delayed, unavailable, or subject to provider limits. Always verify important results independently.

## Technology overview

The project uses the following services and technologies in its current setup:

- **Next.js and React** — build the website and server-side application.
- **TypeScript** — adds type checking to the JavaScript code.
- **MongoDB** — database for supported saved application data.
- **NextAuth** — manages sign-in sessions and Google authentication.
- **Upstox API** — provides market data, subject to API access and limits.
- **AI-compatible API** — powers the AI analyst using the configured base URL, API key, and model.
- **Charting and analysis utilities** — display price history and support technical analysis.

The exact package versions and additional libraries are defined by the project's `package.json` and lockfile.

---

## Setup guide

This section explains how to run the project locally on your computer.

### 1. Install the required software

Install:

- **Node.js** — use a current LTS version compatible with the project's `package.json`.
- **npm** — normally included with Node.js.
- **Git** — if you are cloning the project from a Git repository.
- **MongoDB** — either a MongoDB Atlas cloud database or a local MongoDB instance.
- Access credentials for Google OAuth, Upstox, and your chosen AI API provider.

You do not need to install MongoDB locally if you use MongoDB Atlas.

### 2. Download the project and open its folder

If the project is hosted in Git, clone it and enter the project directory:

```bash
git clone YOUR_REPOSITORY_URL
cd YOUR_PROJECT_DIRECTORY
```

Replace the example values with your repository URL and folder name. If you already have the project on your computer, open a terminal in the directory containing `package.json`.

If the Next.js application is inside a subfolder such as `nextapp`, enter that folder before running the commands below:

```bash
cd nextapp
```

Use the folder that actually contains the application's `package.json`.

### 3. Install dependencies

Run:

```bash
npm install
```

If the repository uses a different package manager, follow the lockfile and project instructions instead (for example, `pnpm install` for `pnpm-lock.yaml`).

### 4. Create the environment file

Create a file named `.env.local` in the **Next.js application directory**, alongside its `package.json`.

Add the following variables:

```dotenv
MONGODB_URI=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
UPSTOX_ACCESS_TOKEN=
AI_API_KEY=
AI_BASE_URL=
AI_MODEL=
```

Fill in the values using the guide below. Do not commit real credentials to Git or paste them into public issues, screenshots, or chat messages.

| Variable | What it is for | What value to provide |
|---|---|---|
| `MONGODB_URI` | Connects the application to MongoDB. | Your database connection string, such as a MongoDB Atlas URI. Include the correct database name and ensure network access and database permissions are configured. |
| `NEXTAUTH_SECRET` | Secret used to protect authentication/session data. | Generate a long, random secret. Example command: `openssl rand -base64 32`. |
| `NEXTAUTH_URL` | The base URL of the application used by authentication. | For local development, commonly `http://localhost:3000`. Use your actual local port if different. In production, use your deployed HTTPS URL. |
| `GOOGLE_CLIENT_ID` | Identifies your app to Google sign-in. | The OAuth 2.0 Client ID from your Google Cloud project. |
| `GOOGLE_CLIENT_SECRET` | Lets the server complete Google OAuth sign-in. | The OAuth 2.0 Client Secret from the same Google Cloud project. Keep it private. |
| `UPSTOX_ACCESS_TOKEN` | Authorizes requests to the Upstox API. | A valid access token issued for your Upstox API application. Tokens may expire; follow the current Upstox authentication flow when that happens. |
| `AI_API_KEY` | Authenticates requests to your AI provider. | An API key issued by the provider serving your chosen model. |
| `AI_BASE_URL` | Tells the server where to send AI API requests. | The base URL required by your AI provider or compatible API service. Use the format expected by the code in this repository. |
| `AI_MODEL` | Selects the model used for AI responses. | The exact model identifier supported by your AI provider. |

These are environment variable names supplied for this project. Confirm the expected URL format, model identifier, and authentication requirements against your configured providers and the implementation in the repository.

### 5. Configure Google sign-in

1. Open the Google Cloud Console.
2. Create or select a Google Cloud project.
3. Configure the OAuth consent screen as required by Google.
4. Create an **OAuth client ID** for a web application.
5. Add the correct local callback URL to the authorized redirect URIs. For a standard NextAuth setup, this is commonly:

   ```text
   http://localhost:3000/api/auth/callback/google
   ```

6. Copy the client ID and client secret into `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

If your application uses a different authentication configuration or port, use the callback URL expected by that implementation. For production, add the production callback URL in Google Cloud as well.

### 6. Configure MongoDB

1. Create a database in MongoDB Atlas or use an existing MongoDB server.
2. Create a database user with the permissions the application needs.
3. Configure Atlas network access so your development machine or deployed server can connect.
4. Copy the connection string into `MONGODB_URI`.
5. Replace any placeholder username, password, or database name in the URI with the correct values.

Never expose a database password in frontend code. Database connections should be made on the server.

### 7. Configure Upstox market data

1. Create or open your Upstox developer application.
2. Follow Upstox's current authorization process to obtain an access token.
3. Add the token to `UPSTOX_ACCESS_TOKEN`.
4. Check that the requested instruments and API endpoints are supported by your account and token.

Upstox access tokens can expire and API calls are subject to provider limits. If prices or charts do not load, check the server logs, token validity, instrument identifiers, and the current Upstox API documentation.

### 8. Configure the AI provider

1. Choose an AI provider that supports the API format expected by this project.
2. Create an API key.
3. Set `AI_API_KEY`, `AI_BASE_URL`, and `AI_MODEL`.
4. Confirm that the selected model is available to your account and that billing or usage limits are configured if required.

The exact `AI_BASE_URL` and `AI_MODEL` values depend on your provider. Do not copy example values from another provider unless the code and API are compatible.

### 9. Start the development server

From the directory containing the Next.js `package.json`, run:

```bash
npm run dev
```

Open the local URL printed in the terminal. In a typical setup, it is:

```text
http://localhost:3000
```

If `npm run dev` is not defined, inspect the `scripts` section of `package.json` and use the development command provided by the project.

### 10. Build for production

Before deploying, test the application locally and make sure all required environment variables are configured.

```bash
npm run build
npm run start
```

These commands assume the project defines the usual Next.js `build` and `start` scripts. Deploy using a platform compatible with the project's Next.js version, and configure the same environment variables in that platform's server-side environment settings. Use the production application URL for `NEXTAUTH_URL`.

---

## Troubleshooting

### The application says MongoDB connection failed

- Check that `MONGODB_URI` is correct.
- Confirm the database user and password.
- Check MongoDB Atlas network access rules.
- Check the terminal logs for the exact database error.

### Google sign-in fails or redirects to an error

- Confirm that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` match the same OAuth client.
- Verify the authorized redirect URI in Google Cloud.
- Confirm `NEXTAUTH_URL` matches the local address or deployed application URL.
- Confirm `NEXTAUTH_SECRET` is set.

### Stock prices or charts do not load

- Check that `UPSTOX_ACCESS_TOKEN` is valid and has the required access.
- Check the server terminal or deployment logs for API errors.
- Verify instrument identifiers, request parameters, and current provider limits.
- Check whether the market is open and whether historical data is available for the requested period.

### The AI analyst does not respond

- Confirm `AI_API_KEY`, `AI_BASE_URL`, and `AI_MODEL` are correct.
- Verify that the selected model is available to your account.
- Check provider usage limits and billing.
- Inspect the server logs for request, authentication, or response-format errors.

### An environment variable appears to be missing

- Confirm the file is named `.env.local` and is in the Next.js application directory.
- Restart the development server after changing environment variables.
- Make sure server-only secrets are read in server-side code, not exposed through client-side variables.
- Do not add the `NEXT_PUBLIC_` prefix to private keys or tokens.

### Port 3000 is already in use

Run the development server on another port if needed:

```bash
npm run dev -- --port 3001
```

If you use another port, update `NEXTAUTH_URL` and your Google OAuth callback URL accordingly.

---

## Security notes

- Keep `.env.local` out of version control. Check that `.env.local` is listed in `.gitignore`.
- Never commit real API keys, OAuth secrets, database passwords, or access tokens.
- Keep market-data and AI API calls on the server when they require private credentials.
- If a secret is accidentally published, revoke or rotate it with the provider immediately.
- Use HTTPS and secure production environment variables when deploying.
- Limit database permissions to what the application needs.

## Financial-use disclaimer

Quantify.ai is intended for research, analysis, and learning. AI-generated explanations, technical indicators, historical charts, and strategy results can be incomplete or incorrect. Historical performance does not guarantee future results. This project does not guarantee profits and should not be treated as personalized financial advice. Users are responsible for verifying information and making their own decisions.

## Project configuration checklist

Before running the application, confirm that:

- [ ] Dependencies are installed.
- [ ] `.env.local` exists in the correct directory.
- [ ] All nine environment variables have the appropriate values.
- [ ] MongoDB is reachable.
- [ ] Google OAuth redirect URLs match the local or production URL.
- [ ] The Upstox access token is valid.
- [ ] The AI provider URL, API key, and model identifier are correct.
- [ ] The development server starts without errors.

## Contributing and maintenance

When changing the project, keep environment variables documented, avoid committing secrets, and update this README when setup steps or required services change.
