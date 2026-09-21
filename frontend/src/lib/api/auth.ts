import { api } from "./client";
import type { User } from "../types";

export function login(phone: string, password: string) {
  return api<User>("/auth/login", { method: "POST", body: { phone, password } });
}

export function register(fullName: string, phone: string, password: string) {
  return api<User>("/auth/register", { method: "POST", body: { fullName, phone, password } });
}

export function logout() {
  return api<object>("/auth/logout", { method: "POST" });
}

export function revokeSession(id: number) {
  return api<object>(`/auth/sessions/${id}`, { method: "DELETE" });
}

export function requestPasswordReset(phone: string) {
  return api<{ expiresIn: number; resendAfter: number }>("/user/forgot-password", {
    method: "POST",
    body: { phone },
  });
}

export function verifyResetCode(phone: string, code: string) {
  return api<{ resetToken: string }>("/user/verify-otp", {
    method: "POST",
    body: { phone, code },
  });
}

export function resetPassword(phone: string, resetToken: string, newPassword: string) {
  return api<object>("/user/reset-password", {
    method: "POST",
    body: { phone, resetToken, newPassword },
  });
}

export function updateProfile(userId: number, fullName: string) {
  return api<User>(`/user/${userId}`, { method: "PATCH", body: { fullName } });
}

