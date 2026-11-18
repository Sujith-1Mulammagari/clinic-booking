# Clinic Booking System

Spring Boot + React + MySQL, served by Caddy (automatic HTTPS), all in Docker Compose.

## 1. Run locally
1. Install Docker Desktop.
2. `cp .env.example .env` (keep `DOMAIN=:80`, change the passwords).
3. `docker compose up --build`
4. Open http://localhost. The "Clinic staff" tab uses your `ADMIN_KEY`.

## 2. Push to GitHub
```
git init && git add . && git commit -m "Clinic booking system"
git branch -M main
git remote add origin https://github.com/<you>/clinic-booking.git
git push -u origin main
```
`.env` is git-ignored, so your passwords never reach GitHub.

## 3. Deploy on AWS EC2
1. Point a DuckDNS subdomain (e.g. `cityclinic.duckdns.org`) at the EC2 public IP.
2. Security group inbound: 80 and 443 from anywhere, 22 from your IP only.
3. On the server, install Docker, then:
```
git clone https://github.com/<you>/clinic-booking.git && cd clinic-booking
cp .env.example .env && nano .env     # DOMAIN=cityclinic.duckdns.org + strong passwords
docker compose up -d --build
```
Caddy gets a free Let's Encrypt certificate on its own and renews it. Open https://cityclinic.duckdns.org.

## 4. Update later
Push changes from your laptop, then on the server:
```
git pull && docker compose up -d --build
```

## Notes
- Ports 80/443 are used by this app. Stop any other app on the same server first (`docker compose down` in its folder).
- On a 1 GB instance the build can run out of memory. Add swap first:
  `sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile`
- Back up the database: `docker compose exec db mysqldump -uroot -p"$DB_ROOT_PASSWORD" clinic > backup.sql`
