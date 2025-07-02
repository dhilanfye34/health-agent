# 🩺 Health Agent

<div align="center">
    <img src="https://raw.githubusercontent.com/agentuity/cli/refs/heads/main/.github/Agentuity.png" alt="Agentuity" width="100"/> <br/>
    <strong>Build Agents, Not Infrastructure</strong> <br/>
    <br/>
        <a target="_blank" href="https://app.agentuity.com/deploy" alt="Agentuity">
            <img src="https://app.agentuity.com/img/deploy.svg" /> 
        </a>
    <br />
</div>

A Slack-native fitness & recovery coach powered by OpenAI **+** the WHOOP Developer API.  
It lives in your Slack DMs, fetches your latest recovery/sleep/strain data, logs workouts, and sends bite-sized motivation throughout the day.

**Features**  
- **Daily nudges** – scheduled cron jobs send random “move / hydrate / breathe” reminders  
- **WHOOP integration** – fetches today’s Recovery, Sleep, and Strain data and turns the numbers into plain-English advice  
- **Workout logging** – DM “Log workout: 5 km run 28 min” and the entry is stored in Postgres  
- **Recent activity** – ask “What were my workouts yesterday?” to see your latest sessions  
- **Thread-aware chat** – replies in the same DM thread, drops a 🤔 placeholder while thinking, then edits in the final reply  

**Tech stack**  
Bun Runtime · Agentuity SDK · GPT-4o-mini · AI-SDK Tools · Slack Web API · WHOOP API · Drizzle ORM · Postgres

---

## 🚀 Quick Start

1. **Clone the repo**

    ```bash
    git clone https://github.com/<your-org>/health-agent.git
    cd health-agent
    ```
---

## 1. Set Up WHOOP API

1. **Create a Developer Application**  
   - Go to https://developer.whoop.com/ → **My Apps** → **Create App**  
   - Under **Redirect URLs**, add `http://localhost:3000/callback`

2. **Configure OAuth Scopes**  
   Enable **read** access to each of these scopes:  
   - read:recovery  
   - read:cycles  
   - read:sleep  
   - read:workout  
   - read:profile  
   - read:body_measurement  

3. **Generate an OAuth Authorization Code**  
   Build and open in your browser (replace `<WHOOP_CLIENT_ID>` from the WHOOP project):  
   ```
   https://api.prod.whoop.com/oauth/oauth2/auth?client_id=<WHOOP_CLIENT_ID>&redirect_uri=http://localhost:3000/callback&response_type=code&scope=read:recovery%20read:cycles%20read:sleep%20read:workout%20read:profile%20read:body_measurement&state=whoopSTATE123
   ```
   - Sign in and authorize  
   - You’ll be redirected to  
     `http://localhost:3000/callback?code=<AUTH_CODE>&state=whoopSTATE123`  
   - Copy the `code=` value

4. **Exchange the Code for Tokens**  
   ```bash
   curl -XPOST https://api.prod.whoop.com/oauth/oauth2/token \
     -d grant_type=authorization_code \
     -d code=<AUTH_CODE> \
     -d client_id=$WHOOP_CLIENT_ID \
     -d client_secret=$WHOOP_CLIENT_SECRET \
     -d redirect_uri=http://localhost:3000/callback
   ```
   - The JSON response includes `access_token`, `refresh_token`, `expires_in`  
   - Add to `.env`:
     ```
     WHOOP_ACCESS_TOKEN=<ACCESS_TOKEN>
     ```

5. **Retrieve Your WHOOP User ID**  
   ```bash
   curl -H "Authorization: Bearer <WHOOP_ACCESS_TOKEN>" \
     https://api.prod.whoop.com/developer/v1/user/profile/basic
   ```
   - Response contains a numeric `user_id`  
   - Add to `.env`:
     ```
     WHOOP_USER_ID=<YOUR_USER_ID>
     ```

---

## 2. Set Up Slack App and Keys

### 2.1 Create the Slack App
1. Go to https://api.slack.com/apps → **Create New App** → **From scratch**  
2. Name it (e.g. **Health Agent**) and select your testing workspace  
3. Under **App Home → Show Tabs → Chat tab**, enable  
   “Allow users to send Slash commands and messages from the chat tab”

### 2.2 Add Bot-Token Scopes
In **OAuth & Permissions → Bot Token Scopes**, add:  
- chat:write        # send messages & edits  
- im:write          # open DMs  
- im:history        # read DM thread  
- im:read           # read DM thread  
- app_mentions:read  
- users:read        # optional but handy  

Click **Install/Re-install App**. Copy the new **Bot User OAuth Token** into `.env`:
```
SLACK_BOT_TOKEN=xoxb-…
```

### 2.3 Grab the Signing Secret
In **Basic Information → App Credentials → Signing Secret → Show**, copy and add to `.env`:
```
SLACK_SIGNING_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2.4 Enable Events & Point Slack to Your Agent
1. In Agentuity, open the **Agent** tab  
2. Click ➕ on the I/O diagram → **API** → mark **Public**, copy the URL  
3. In Slack, under **Event Subscriptions**:  
   - Toggle **Enable Events** on  
   - **Request URL** → paste your Agentuity URL → **Save** (wait for “Verified ✅”)  
   - **Subscribe to Bot Events** → add:  
     - app_mention  
     - message.im  
   - **Save Changes**

---

## 3. Set Up Supabase Database

1. **Create a project**  
   - Sign in at https://supabase.com/ → **New Project**  
   - Choose a strong Postgres password  
   - Under **Connect**, copy the **Database URL** and **Transaction Pooler URL**

2. **Configure `.env`**  
   ```
   DATABASE_URL=<Database URL>
   ```

3. **Create the workouts table**  
   In **Supabase → SQL Editor → New Query**, run:
   ```sql
   CREATE TABLE IF NOT EXISTS workouts (
     id           serial       PRIMARY KEY,
     user_id      text         NOT NULL,
     ts           timestamptz  DEFAULT now(),
     activity     text         NOT NULL,
     duration_min numeric,
     notes        text
   );
   ```
   > Tip: the same schema lives in `src/agents/coach/db/schema.ts`.



## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Bun**: Version 1.2.4 or higher

## 🚀 Getting Started

### Authentication

Before using Agentuity, you need to authenticate:

```bash
agentuity login
```

This command will open a browser window where you can log in to your Agentuity account.

### Creating a New Agent

To create a new agent in your project:

```bash
agentuity agent new
```

Follow the interactive prompts to configure your agent.

### Development Mode

Run your project in development mode with:

```bash
agentuity dev
```

This will start your project and open a new browser window connecting your agent to the Agentuity Console in DevMode, allowing you to test and debug your agent in real-time.

## 🌐 Deployment

When you're ready to deploy your agent to the Agentuity Cloud:

```bash
agentuity deploy
```

This command will bundle your agent and deploy it to the cloud, making it accessible via the Agentuity platform.

## 📚 Project Structure

```
├── agents/             # Agent definitions and implementations
├── node_modules/       # Dependencies
├── package.json        # Project dependencies and scripts
└── agentuity.yaml      # Agentuity project configuration
```

## 🔧 Configuration

Your project configuration is stored in `agentuity.yaml`. This file defines your agents, development settings, and deployment configuration.

## 🛠️ Advanced Usage

### Environment Variables

You can set environment variables for your project:

```bash
agentuity env set KEY VALUE
```

### Secrets Management

For sensitive information, use secrets:

```bash
agentuity env set --secret KEY VALUE
```

## 📖 Documentation

For comprehensive documentation on the Agentuity JavaScript SDK, visit:
[https://agentuity.dev/SDKs/javascript](https://agentuity.dev/SDKs/javascript)

## 🆘 Troubleshooting

If you encounter any issues:

1. Check the [documentation](https://agentuity.dev/SDKs/javascript)
2. Join our [Discord community](https://discord.gg/agentuity) for support
3. Contact the Agentuity support team

## 📝 License

This project is licensed under the terms specified in the LICENSE file.
