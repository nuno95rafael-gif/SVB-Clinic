// Constante simples, sem "use server" — um ficheiro de server actions só
// pode exportar funções async; exportar isto dali fazia o valor chegar
// como undefined ao cliente em produção (RED_FLAGS.map is not a function).
export const RED_FLAGS = [
  "trauma_recente",
  "febre",
  "perda_peso_inexplicada",
  "alteracoes_neurologicas",
  "dor_noturna",
  "outros_sinais",
] as const;
