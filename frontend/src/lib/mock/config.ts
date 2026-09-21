// `pnpm dev:mock` bilan ishga tushirilganda true bo'ladi: backendga umuman
// so'rov yuborilmaydi — `/api/mock/*` route handler xotiradagi soxta bazadan javob beradi.
// NEXT_PUBLIC_ prefiksi tufayli qiymat ham serverda, ham brauzerda mavjud.
export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

/** Mock rejimida qo'shilish sahifasida ko'rsatiladigan tayyor taklif kodi. */
export const MOCK_INVITE_CODE = "GAP-7K3M";
