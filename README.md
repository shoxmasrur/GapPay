<p align="center"><img src="frontend/public/logo.svg" width="240" alt="GapPay"></p>

# GapPay

Gap (davra jamg‘armasi) platformasi. Bitta repo ichida ikkita loyiha bor:

| Papka       | Texnologiya                  | Port   |
|-------------|------------------------------|--------|
| `backend/`  | NestJS + Prisma + PostgreSQL | `3000` |
| `frontend/` | Next.js 16 + Tailwind CSS 4  | `3001` |

## Ishga tushirish

```bash
pnpm install          # ildizdagi concurrently / cross-env
pnpm install:all      # backend va frontend bog'liqliklari
cp backend/.env.example backend/.env        # qiymatlarni to'ldiring
cp frontend/.env.example frontend/.env.local

pnpm dev              # backend :3000 va frontend :3001 birga ishga tushadi
```

Alohida: `pnpm dev:backend` yoki `pnpm dev:frontend`.

## Frontend va backend qanday bog‘langan

Frontend barcha so‘rovlarni `/api/v1/*` ga yuboradi, `frontend/next.config.ts` dagi
`rewrites` ularni `BACKEND_URL` (default `http://localhost:3000`) ga proksi qiladi.
Shu sababli backend o‘rnatgan httpOnly `accessToken`/`refreshToken` cookie'lari
frontend domenida saqlanadi va CORS sozlash shart emas. Access token eskirsa,
klient avtomatik `/auth/refresh` chaqirib, so‘rovni qayta yuboradi.

## Sahifalar

- `/` — landing
- `/login`, `/register`, `/forgot-password` (OTP orqali parol tiklash)
- `/dashboard` — davralar va navbat holati
- `/gaps`, `/gaps/[id]` — davra yaratish, a‘zo qo‘shish, boshlash, qur‘a, to‘lov
- `/profile` — profil, avatar, faol qurilmalar
- `/admin/users` — foydalanuvchilarni bloklash (faqat SUPER_ADMIN)
