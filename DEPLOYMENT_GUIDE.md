# Zamex Deployment Guide (Production)

This guide walks you through deploying the Zamex system to a production environment (VPS like DigitalOcean, AWS, or similar) and connecting the Frontend via Vercel.

## 1. Prerequisites
- **VPS Server:** Ubuntu 22.04 LTS (Minimum 2GB RAM / 1 CPU). Suggested: DigitalOcean Droplet ($12/mo).
- **Domain Name:** e.g., `zamex.mn` (DNS access required).
- **Docker & Docker Compose:** Installed on the server.
- **Vercel Account:** For frontend deployment.

## 2. Server Setup (Backend & Database)

### Step 2.1: Prepare the Server
Connect to your VPS via SSH:
```bash
ssh root@your_server_ip
```
Install Docker (if not installed):
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

### Step 2.2: Clone Repository
On your server, clone your repository (or copy files manually via SCP/SFTP):
```bash
git clone https://github.com/yourusername/zamex.git
cd zamex/backend
```

### Step 2.3: Configure Environment Variables
Create a `.env` file in the `backend` directory:
```bash
nano .env
```
Paste your production variables (IMPORTANT: Change secrets!):
```env
PORT=4000
DATABASE_URL="postgresql://postgres:zamex_secure_pass@db:5432/zamex_prod?schema=public"
JWT_SECRET="your_super_long_secure_secret_key_here"
# Add other API keys (OpenAI, QPay, etc.) here
```
*Note: The DATABASE_URL uses `db` as host because we will run Postgres in Docker.*

### Step 2.4: Run with Docker Compose
Create a `docker-compose.yml` file in the `backend` directory:
```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "4000:4000"
    env_file: .env
    depends_on:
      - db
    restart: always

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: zamex_secure_pass
      POSTGRES_DB: zamex_prod
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

volumes:
  postgres_data:
```

Start the services:
```bash
docker compose up -d --build
```

### Step 2.5: Run Migrations
Apply the database schema to the new Postgres DB:
```bash
docker compose exec api npx prisma migrate deploy
docker compose exec api npx prisma db seed
```

## 3. Frontend Deployment (Vercel)

1.  Push your code to GitHub/GitLab.
2.  Go to **Vercel.com** -> Add New Project -> Import your repo.
3.  **Root Directory:** Select `frontend`.
4.  **Build Settings:** Default is usually fine (`npm run build`).
5.  **Environment Variables:** Add in Vercel settings:
    *   `NEXT_PUBLIC_API_URL`: `http://your_server_ip:4000/api/v1` (or your domain if configured).
6.  Click **Deploy**.

## 4. Domain & SSL (Nginx Reverse Proxy) - Optional but Recommended

To serve your backend on `https://api.zamex.mn` instead of `http://IP:4000`:

1.  Install Nginx: `apt install nginx`
2.  Configure Nginx Proxy Pass to port 4000.
3.  Use Certbot for free SSL: `certbot --nginx`.

---
**Troubleshooting:**
- Check logs: `docker compose logs -f api`
- Restart: `docker compose restart`
