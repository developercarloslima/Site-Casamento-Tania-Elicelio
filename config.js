export const EVENT_CONFIG = {
  bride: {
    firstName: "Tânia",
    fullName: "Tânia Maria",
  },
  groom: {
    firstName: "Eliclécio",
    fullName: "Eliclécio Batista",
  },
  monogram: "T & E",
  event: {
    name: "Noivado e Chá de Bênção",
    invitationText: "Convidamos você para celebrar o nosso Noivado e Chá de Bênção",
  },
  dateISO: "2026-09-15T20:00:00-03:00",
  dateLabel: "15 de setembro de 2026",
  timeLabel: "20:00 horas",

  // Substitua pelos dados reais do Noivado e Chá de Bênção.
  venue: {
    name: "Nome do espaço da cerimônia",
    address: "Endereço completo da celebração",
    mapsUrl: "https://maps.google.com/",
  },

  verse: {
    text: "Se o Senhor não edificar a casa, em vão trabalham os que a edificam.",
    reference: "Salmos 127:1",
  },

  // Configure o projeto Supabase para habilitar persistência global.
  // A chave pública/publishable pode ficar no navegador; nunca use service_role aqui.
  supabase: {
    url: "",
    publishableKey: "",
  },

  // Fallback opcional: número com DDI + DDD, somente dígitos, ex.: 5582999999999.
  // Para envio realmente automático, configure a Edge Function descrita no README.
  brideWhatsappNumber: "",

  music: {
    provider: "youtube",
    playlistId: "PLCggmkGw79n8V3eZuRpuzETFljnj5-qNw",
    title: "Playlist do Noivado e Chá de Bênção",
  },

  refreshGiftsEveryMs: 15000,
};
