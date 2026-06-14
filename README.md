# TeleVault

> **Secure Private Cloud Storage via Telegram Backend**

TeleVault is a self-hosted, private cloud storage system that uses Telegram as a raw byte storage layer. Users interact exclusively through a modern, responsive local web application. Telegram is never accessed directly by the end user for file operations. 

All files uploaded to Telegram are **unrecognizable, AES-256 encrypted, and fragmented**. They have absolutely no value without the local system to reconstruct them.

---

## ✨ Features

- **Zero Trust Architecture:** Files are chunked and encrypted *before* leaving your machine. Telegram only stores nameless, encrypted binary blobs.
- **Local Sovereignty:** All file metadata, search indexes, chunk maps, and encryption keys stay on your local PostgreSQL/SQLite database.
- **Unlimited Storage:** Store as much data as you want, leveraging Telegram's massive cloud infrastructure.
- **Resumable Transfers:** Built-in fault tolerance. If your server crashes or network disconnects, uploads and downloads resume exactly where they left off.
- **Lightning Fast Search:** Search your files by name or custom tags instantly without querying Telegram.

---

## 🚀 Getting Started

### Prerequisites

Before starting, ensure you have the following software installed on your machine. Here is where you can download them:

- **Git**: Required to download the repository. [Download Git here](https://git-scm.com/downloads).
- **Docker Desktop**: Required to run the database (PostgreSQL) and job queue (Redis) seamlessly. It includes Docker Compose. [Download Docker here](https://www.docker.com/products/docker-desktop/).
- **Node.js (v18+)**: Required to build and run the frontend Web UI. [Download Node.js here](https://nodejs.org/).
- **Python (v3.11+)**: Required to run the FastApi backend and chunking engine. *(Note for Windows users: Make sure to check the box "Add Python to PATH" during installation)*. [Download Python here](https://www.python.org/downloads/).

### Step 1: Clone the Repository

Download the project source code from GitHub:
```bash
git clone https://github.com/yourusername/televault.git
cd televault
```

### Step 2: Install Dependencies

TeleVault requires a few libraries for both the backend and frontend.

**1. Install Backend Dependencies (Python):**
Open your terminal inside the `televault` folder and run:
```bash
cd backend
pip install -r requirements.txt
cd ..
```
*Manual Fallback:* If the command above fails, you can manually install the required libraries by running:
```bash
pip install fastapi "uvicorn[standard]" pydantic pydantic-settings "sqlalchemy[asyncio]" asyncpg alembic redis arq telethon cryptography argon2-cffi "python-jose[cryptography]" python-multipart httpx aiofiles aiosqlite loguru
```

**2. Install Frontend Dependencies (Node.js):**
In the same terminal, run:
```bash
cd frontend
npm install
cd ..
```

### Step 3: Obtain Telegram API Credentials

To let TeleVault communicate with Telegram, you need an API ID and Hash.
1. Go to [my.telegram.org](https://my.telegram.org) and log in with your Telegram phone number.
2. Click on **"API development tools"**.
3. Fill out the form (you can enter anything for the App title and Short name).
4. Click **Create application**.
5. Copy your **`App api_id`** and **`App api_hash`**. Keep these secret!

### Step 4: Create a Private Storage Channel

This is where TeleVault will store the encrypted file chunks.
1. Open your Telegram app.
2. Create a **New Channel**.
3. Name it something like "TeleVault Storage" and set the Channel Type to **Private**.
4. You need the **Channel ID** (it must start with `-100`). 
   - *Tip to get the Channel ID:* Log into Telegram Web (web.telegram.org/a/), open the channel, and look at the URL. It will look like `https://web.telegram.org/a/#-1001234567890`. Copy the `-100...` number.

### Step 5: Configure Environment Variables

1. Copy the sample environment file:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in your details:
   ```env
   TELEGRAM_API_ID=your_api_id
   TELEGRAM_API_HASH=your_api_hash
   TELEGRAM_STORAGE_CHANNEL_ID=-100...
   ```
3. **Generate Secure Passwords:**
   Your `.env` file contains fields like `POSTGRES_PASSWORD`, `REDIS_PASSWORD`, and `SECRET_KEY`. You must replace the default `change_me` values with your own strong, randomly generated passwords to keep your storage safe. 
   **Recommendation:** To easily generate a cryptographically secure 32-character hex string for your `SECRET_KEY` and passwords, run one of these commands in your terminal:
   ```bash
   # Using OpenSSL:
   openssl rand -hex 32
   
   # OR using Python:
   python -c "import secrets; print(secrets.token_hex(32))"
   ```

4. **Generate the Telegram Session String:**
   To allow TeleVault to upload files seamlessly in the background without constantly asking you for an SMS login code, you need a session string. 
   Make sure you have Python installed, then open your terminal and run:
   ```bash
   pip install telethon
   python -c "from telethon.sync import TelegramClient; from telethon.sessions import StringSession; c=TelegramClient(StringSession(),'YOUR_API_ID','YOUR_API_HASH'); c.start(); print(c.session.save())"
   ```
   *(Make sure to replace `YOUR_API_ID` and `YOUR_API_HASH` with the credentials you got in Step 3).*
   It will ask you for your phone number and the login code Telegram sends you. After you log in, it will print a very long string of random characters. Copy that entire string and paste it into your `.env` file like this: `TELEGRAM_SESSION_STRING=1BVts...`

### Step 6: Start the Services

TeleVault comes with handy startup scripts for both Windows and Linux/macOS. 

**On Windows (PowerShell or CMD):**
```powershell
.\televault.ps1 start
# OR
.\televault.bat start
```

This script will automatically start the Docker containers (for the database and Redis), launch the FastAPI backend, and start the Vite frontend server.

### Step 7: Access the Web UI

Once the services are running, open your browser and navigate to:
**[http://localhost:5173](http://localhost:5173)**

The first time you access the UI, you'll set a Master Password. **Do not lose this password!** It is used to derive the Key Encryption Key (KEK). If you lose it, your files will be permanently unrecoverable.

---

## 🏗️ Architecture Summary

TeleVault is split into three main components:
1. **Frontend (React/Vite):** A stunning, responsive UI to manage your files, view transfers, and search metadata.
2. **Backend (FastAPI):** Orchestrates file chunking, AES-256 encryption, HMAC integrity verification, and database interactions.
3. **Storage Layer (Telegram MTProto):** The backend uses `Telethon` to securely stream encrypted chunks directly into your private Telegram channel.

---

## 🛡️ Security & Privacy

- **Data at Rest (Telegram):** Chunked, Obfuscated, AES-256-CBC Encrypted.
- **Data in Transit:** TLS secured (MTProto).
- **Integrity Verification:** Every downloaded chunk is verified against an HMAC-SHA256 signature before decryption to prevent tampering.
- **Local Keys:** Keys are stored locally, encrypted by a master password using Argon2id.

---

## 🛠️ Control Panel (Startup Scripts)

TeleVault provides a unified control script (`televault.ps1` for Windows PowerShell, or `televault.bat`). Running the script opens an interactive menu that manages the entire lifecycle:

- **Start TeleDrive:** Launches the FastAPI backend and Vite frontend in separate terminal windows so you can monitor logs live.
- **Start in Background:** Runs both services in the background without opening new windows. Real-time logs are instead routed to `logs/backend.log` and `logs/frontend.log`.
- **Stop TeleDrive:** Safely kills all TeleDrive background processes and free up the network ports.
- **Check Status Details:** Shows exactly whether the Backend (Port 8000) and Frontend (Port 5173) are running, including their Windows Process IDs.

---

## 🔍 Under the Hood: How Uploading Works

When you drag and drop a file into the TeleVault UI, here is what happens entirely locally on your machine:

1. **Key Derivation:** Your master password drives an Argon2id algorithm to decrypt a unique AES-256 key and HMAC-SHA256 key for that specific file.
2. **Chunking:** The file is split into 1.5 MB pieces to adhere to Telegram's limits and maximize upload speed.
3. **Encryption:** Each chunk is individually encrypted using AES-256-CBC with a random, unique Initialization Vector (IV).
4. **Integrity Tagging:** A cryptographic HMAC tag is appended to the encrypted chunk to prevent tampering.
5. **Upload to Telegram:** The `Telethon` MTProto client streams the meaningless chunks to your private Telegram channel.
6. **Indexing:** A chunk map (mapping chunk sequence order to Telegram Message IDs) is saved securely to your local PostgreSQL database. 

---

## ❓ Troubleshooting / FAQ

**Q: I lost my Master Password. Can I recover my files?**  
**No.** The Master Password is not stored anywhere in the database or code. It drives the Key Encryption Key (KEK) used to decrypt your AES file keys. If you lose it, your data is mathematically unrecoverable.

**Q: Why did an upload fail with `FloodWaitError`?**  
Telegram has strict API rate limits. TeleVault automatically handles this by pausing and retrying after a cooldown period, but if you upload thousands of files instantly, Telegram may block the API client temporarily. The system will recover automatically.

**Q: My frontend doesn't start; port 5173 is in use.**  
Run `.\teledrive.ps1 status` to see what is running. If another background process is using port 5173, you'll need to stop it or edit `vite.config.js` to map to a different port.

---

## 📜 License

MIT License. See `LICENSE` for details.
