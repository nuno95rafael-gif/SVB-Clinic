// Constantes sem dependências de servidor (next/headers, Supabase server
// client) — para poderem ser importadas tanto de Server Components/actions
// como de componentes "use client" (ex: o seletor de clínica na sidebar)
// sem arrastar esse código para o bundle do browser.

export const ACTIVE_CLINIC_COOKIE = "active_clinic_id";
// Valor especial do cookie que representa "Todas as clínicas" — distinto de
// um cookie em falta (que continua a cair na primeira clínica ativa).
export const ALL_CLINICS_VALUE = "all";
