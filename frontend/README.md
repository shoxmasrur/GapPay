# Gap platformasi — frontend

## Ishga tushirish

| Buyruq | Nima qiladi |
| --- | --- |
| `pnpm dev` | Haqiqiy backend bilan (`BACKEND_URL`, standart `http://localhost:3000`) |
| `pnpm dev:mock` | Backendsiz, `src/lib/mock-data.ts` dagi ma'lumotlar bilan |
| `pnpm build` / `pnpm build:mock` | Production build (haqiqiy / mock) |

Ilova: http://localhost:3001.

### Mock rejimi

`pnpm dev:mock` da frontend `/api/mock/*` route handler'iga so'rov yuboradi — u TZ'dagi
endpointlarni xotiradagi soxta baza ustida bajaradi (`src/lib/mock/`). Haqiqiy rejimda aynan
shu so'rovlar `/api/v1/*` orqali backendga ketadi.

- Istalgan telefon/parol bilan kirish mumkin (noma'lum raqam → demo foydalanuvchi "Sardor Aliyev").
- SMS kodlar (parol tiklash, "Pulni oldim") — istalgan 6 raqam.
- Taklif kodi bilan qo'shilishni sinash: `GAP-7K3M`.
- Boshqa a'zolar naqd to'lov va payout'ni ~8 soniyada "o'zi" tasdiqlaydi.
- "Mock: bo'sh o'rinlarni to'ldirish" tugmasi davrani faollashtirishni sinash uchun.
- Ma'lumotlar server qayta ishga tushganda yoki Profil → "Mock ma'lumotlarini tiklash" bilan boshlang'ich holatga qaytadi.

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
