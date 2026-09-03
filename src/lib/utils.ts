import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Fuso fixo da clínica (Portugal) — datas/horas guardadas em UTC são sempre
// mostradas em hora de Lisboa, independentemente do fuso onde o código
// corre (o runtime da Vercel é UTC; sem isto, cada consulta aparecia com a
// hora trocada consoante fosse renderizada no servidor ou no browser).
const CLINIC_TIME_ZONE = "Europe/Lisbon";

export function formatDate(d: string | Date) {
  return new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "medium",
    timeZone: CLINIC_TIME_ZONE,
  }).format(new Date(d));
}

export function formatDateTime(d: string | Date) {
  return new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: CLINIC_TIME_ZONE,
  }).format(new Date(d));
}

export function formatTime(d: string | Date) {
  return new Intl.DateTimeFormat("pt-PT", {
    timeStyle: "short",
    timeZone: CLINIC_TIME_ZONE,
  }).format(new Date(d));
}

export function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(v);
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}
