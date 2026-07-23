import { WEDDING_CONFIG } from "./config.js";

const LOCAL_GUESTS_KEY = "wedding_demo_guests_v1";
const LOCAL_GIFTS_KEY = "wedding_demo_gifts_v1";

const sampleGifts = [
  {
    id: "demo-air-fryer",
    name: "Air Fryer 5L",
    description: "Para deixar as refeições do novo lar mais práticas e saborosas.",
    priceCents: 49990,
    imageUrl: "./assets/gifts/air-fryer.svg",
    purchaseUrl: "https://www.amazon.com.br/s?k=air+fryer+5l",
    isChosen: false,
  },
  {
    id: "demo-panelas",
    name: "Jogo de Panelas",
    description: "Um conjunto completo para os primeiros almoços em família.",
    priceCents: 69990,
    imageUrl: "./assets/gifts/panelas.svg",
    purchaseUrl: "https://www.amazon.com.br/s?k=jogo+de+panelas",
    isChosen: false,
  },
  {
    id: "demo-liquidificador",
    name: "Liquidificador",
    description: "Para vitaminas, receitas e muitos cafés da manhã juntos.",
    priceCents: 24990,
    imageUrl: "./assets/gifts/liquidificador.svg",
    purchaseUrl: "https://www.amazon.com.br/s?k=liquidificador",
    isChosen: false,
  },
  {
    id: "demo-cama",
    name: "Jogo de Cama",
    description: "Conforto e aconchego para o quarto do casal.",
    priceCents: 31990,
    imageUrl: "./assets/gifts/jogo-de-cama.svg",
    purchaseUrl: "https://www.amazon.com.br/s?k=jogo+de+cama+casal",
    isChosen: false,
  },
  {
    id: "demo-cafeteira",
    name: "Cafeteira Elétrica",
    description: "Para começar os dias com café e boas conversas.",
    priceCents: 28990,
    imageUrl: "./assets/gifts/cafeteira.svg",
    purchaseUrl: "https://www.amazon.com.br/s?k=cafeteira+el%C3%A9trica",
    isChosen: false,
  },
  {
    id: "demo-jantar",
    name: "Aparelho de Jantar",
    description: "Para receber pessoas queridas à mesa no novo lar.",
    priceCents: 54990,
    imageUrl: "./assets/gifts/aparelho-de-jantar.svg",
    purchaseUrl: "https://www.amazon.com.br/s?k=aparelho+de+jantar",
    isChosen: false,
  },
];

function normalizeName(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function firstName(value) {
  return value.trim().split(/\s+/)[0] || "Convidado(a)";
}

function readJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

class LocalWeddingApi {
  constructor() {
    this.mode = "demo";
    if (!localStorage.getItem(LOCAL_GIFTS_KEY)) {
      writeJSON(LOCAL_GIFTS_KEY, sampleGifts);
    }
  }

  async enterGuest(fullName) {
    const cleanName = fullName.trim().replace(/\s+/g, " ");
    const key = normalizeName(cleanName);
    const guests = readJSON(LOCAL_GUESTS_KEY, {});

    if (!guests[key]) {
      guests[key] = {
        id: crypto.randomUUID?.() || `guest-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        fullName: cleanName,
        firstName: firstName(cleanName),
        confirmed: false,
      };
      writeJSON(LOCAL_GUESTS_KEY, guests);
    }

    return guests[key];
  }

  async confirmPresence(guestId) {
    const guests = readJSON(LOCAL_GUESTS_KEY, {});
    const guest = Object.values(guests).find((item) => item.id === guestId);
    if (!guest) throw new Error("Convidado não encontrado.");
    guest.confirmed = true;
    guest.confirmedAt = new Date().toISOString();
    writeJSON(LOCAL_GUESTS_KEY, guests);
    return true;
  }

  async listGifts() {
    return readJSON(LOCAL_GIFTS_KEY, sampleGifts);
  }

  async chooseGift(giftId, guestId) {
    const gifts = readJSON(LOCAL_GIFTS_KEY, sampleGifts);
    const index = gifts.findIndex((gift) => gift.id === giftId);
    if (index < 0) throw new Error("Presente não encontrado.");
    if (gifts[index].isChosen) {
      return { success: false, reason: "already_chosen", giftName: gifts[index].name };
    }

    gifts[index].isChosen = true;
    gifts[index].chosenBy = guestId;
    gifts[index].chosenAt = new Date().toISOString();
    writeJSON(LOCAL_GIFTS_KEY, gifts);

    return {
      success: true,
      giftName: gifts[index].name,
      purchaseUrl: gifts[index].purchaseUrl,
    };
  }

  async notifyBride() {
    return { automatic: false };
  }
}

class SupabaseWeddingApi {
  constructor(url, key, createClient) {
    this.mode = "supabase";
    this.client = createClient(url, key);
  }

  async enterGuest(fullName) {
    const { data, error } = await this.client.rpc("enter_wedding", {
      p_full_name: fullName,
    });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) throw new Error("Não foi possível registrar o convidado.");

    return {
      id: row.guest_id,
      fullName: row.full_name,
      firstName: row.first_name,
      confirmed: row.confirmed,
    };
  }

  async confirmPresence(guestId) {
    const { data, error } = await this.client.rpc("confirm_presence", {
      p_guest_id: guestId,
    });
    if (error) throw error;
    if (!data) throw new Error("Não foi possível confirmar sua presença.");
    return true;
  }

  async listGifts() {
    const { data, error } = await this.client.rpc("list_public_gifts");
    if (error) throw error;

    return (data || []).map((row) => ({
      id: row.gift_id,
      name: row.name,
      description: row.description,
      priceCents: row.price_cents,
      imageUrl: row.image_url,
      isChosen: row.is_chosen,
    }));
  }

  async chooseGift(giftId, guestId) {
    const { data, error } = await this.client.rpc("choose_gift", {
      p_gift_id: giftId,
      p_guest_id: guestId,
    });
    if (error) throw error;

    const row = Array.isArray(data) ? data[0] : data;
    return {
      success: Boolean(row?.success),
      giftName: row?.gift_name,
      purchaseUrl: row?.purchase_url,
      reason: row?.reason,
    };
  }

  async notifyBride(giftId, guestId) {
    const { data, error } = await this.client.functions.invoke("notify-bride", {
      body: { giftId, guestId },
    });

    if (error) {
      const details = error?.context
        ? await error.context.json().catch(() => null)
        : null;
      const message = details?.details?.error?.message || details?.error || error.message;
      throw new Error(message || "Não foi possível enviar a mensagem pelo WhatsApp.");
    }

    if (!data?.sent) {
      throw new Error(data?.error || "A função não confirmou o envio da mensagem.");
    }

    return {
      automatic: true,
      sent: true,
      alreadySent: Boolean(data.alreadySent),
      messageId: data.messageId || null,
    };
  }
}

const { url, publishableKey } = WEDDING_CONFIG.supabase;
const hasSupabase = Boolean(url?.trim() && publishableKey?.trim());

let weddingApi;
if (hasSupabase) {
  const { createClient } = await import(
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm"
  );
  weddingApi = new SupabaseWeddingApi(url.trim(), publishableKey.trim(), createClient);
} else {
  weddingApi = new LocalWeddingApi();
}

export { weddingApi };
