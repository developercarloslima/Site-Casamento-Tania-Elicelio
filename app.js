import { WEDDING_CONFIG } from "./config.js";
import { weddingApi } from "./api.js";

const state = {
  guest: null,
  gifts: [],
  selectedGift: null,
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const entryModal = $("#entry-modal");
const entryFormView = $("#entry-form-view");
const entryResponseView = $("#entry-response-view");
const guestNameForm = $("#guest-name-form");
const guestNameInput = $("#guest-name");
const guestSubmitButton = $("#guest-submit");
const guestGreeting = $("#guest-greeting");
const guestMessage = $("#guest-message");
const guestActions = $("#guest-actions");
const entryClose = $("#entry-close");
const giftConfirmModal = $("#gift-confirm-modal");
const giftConfirmMessage = $("#gift-confirm-message");
const giftConfirmActions = $("#gift-confirm-actions");
const giftThanksView = $("#gift-thanks-view");
const giftThanksMessage = $("#gift-thanks-message");
const giftPurchaseLink = $("#gift-purchase-link");
const manualWhatsappButton = $("#manual-whatsapp-button");
const youtubePlayerElement = $("#youtube-player");
let youtubePlayer = null;
let youtubePlayerReady = false;
let soundRequested = false;

function fillWeddingContent() {
  $$('[data-monogram]').forEach((el) => (el.textContent = WEDDING_CONFIG.monogram));
  $$('[data-bride-full]').forEach((el) => (el.textContent = WEDDING_CONFIG.bride.fullName));
  $$('[data-groom-full]').forEach((el) => (el.textContent = WEDDING_CONFIG.groom.fullName));
  $$('[data-bride-first]').forEach((el) => (el.textContent = WEDDING_CONFIG.bride.firstName));
  $$('[data-groom-first]').forEach((el) => (el.textContent = WEDDING_CONFIG.groom.firstName));
  $$('[data-date-label]').forEach((el) => (el.textContent = WEDDING_CONFIG.dateLabel));
  $$('[data-time-label]').forEach((el) => (el.textContent = WEDDING_CONFIG.timeLabel));
  $$('[data-venue-name]').forEach((el) => (el.textContent = WEDDING_CONFIG.venue.name));
  $$('[data-venue-address]').forEach((el) => (el.textContent = WEDDING_CONFIG.venue.address));
  $$('[data-maps-link]').forEach((el) => (el.href = WEDDING_CONFIG.venue.mapsUrl));
  $$('[data-verse-text]').forEach((el) => (el.textContent = `“${WEDDING_CONFIG.verse.text}”`));
  $$('[data-verse-reference]').forEach((el) => (el.textContent = WEDDING_CONFIG.verse.reference));

}


function getYouTubePlaylistId() {
  return (
    WEDDING_CONFIG.music?.playlistId?.trim() ||
    youtubePlayerElement?.dataset.playlistId?.trim() ||
    ""
  );
}

function removeMusicActivationListeners() {
  document.removeEventListener("pointerdown", activateWeddingMusic, true);
  document.removeEventListener("keydown", activateWeddingMusic, true);
  document.removeEventListener("touchstart", activateWeddingMusic, true);
}

function activateWeddingMusic() {
  soundRequested = true;

  if (!youtubePlayerReady || !youtubePlayer) return;

  try {
    youtubePlayer.unMute();
    youtubePlayer.setVolume(65);
    youtubePlayer.playVideo();
    removeMusicActivationListeners();
  } catch (error) {
    console.warn("O navegador aguardará outra interação para liberar o áudio.", error);
  }
}

function createYouTubePlayer() {
  const playlistId = getYouTubePlaylistId();
  if (!youtubePlayerElement || !playlistId || youtubePlayer || !window.YT?.Player) return;

  youtubePlayer = new window.YT.Player("youtube-player", {
    width: "340",
    height: "200",
    host: "https://www.youtube-nocookie.com",
    playerVars: {
      listType: "playlist",
      list: playlistId,
      autoplay: 1,
      loop: 1,
      controls: 1,
      playsinline: 1,
      rel: 0,
    },
    events: {
      onReady(event) {
        youtubePlayerReady = true;
        const iframe = event.target.getIframe();
        iframe.title = WEDDING_CONFIG.music?.title || "Playlist de músicas do casamento";
        iframe.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture; fullscreen");

        // Autoplay com som costuma ser bloqueado pelos navegadores. Por isso,
        // o player começa automaticamente sem som e é ativado na primeira interação.
        event.target.mute();
        event.target.playVideo();

        if (soundRequested) activateWeddingMusic();
      },
      onError(event) {
        console.error("Não foi possível carregar a playlist do YouTube.", event.data);
      },
    },
  });
}

function loadYouTubePlayer() {
  if (!youtubePlayerElement || !getYouTubePlaylistId()) return;

  document.addEventListener("pointerdown", activateWeddingMusic, true);
  document.addEventListener("touchstart", activateWeddingMusic, true);
  document.addEventListener("keydown", activateWeddingMusic, true);

  if (window.YT?.Player) {
    createYouTubePlayer();
    return;
  }

  const previousReadyHandler = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = () => {
    if (typeof previousReadyHandler === "function") previousReadyHandler();
    createYouTubePlayer();
  };

  if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    document.head.appendChild(script);
  }
}

function openModal(modal) {
  modal.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function closeModal(modal) {
  modal.classList.add("hidden");
  if (!$$(".modal-backdrop:not(.hidden)").length) {
    document.body.classList.remove("modal-open");
  }
}

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type === "error" ? "error" : ""}`;
  toast.textContent = message;
  $("#toast-region").appendChild(toast);
  window.setTimeout(() => toast.remove(), 4300);
}

function setButtonLoading(button, loading, loadingText = "Aguarde…") {
  if (!button) return;
  if (loading) {
    button.dataset.originalText = button.textContent;
    button.textContent = loadingText;
    button.disabled = true;
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
    button.disabled = false;
  }
}

function formatMoney(cents) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format((cents || 0) / 100);
}

function createActionButton(text, variant, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `button ${variant || ""}`.trim();
  button.textContent = text;
  button.addEventListener("click", onClick);
  return button;
}

function showGuestResponse() {
  const { guest } = state;
  entryFormView.classList.add("hidden");
  entryResponseView.classList.remove("hidden");
  entryClose.classList.remove("hidden");
  guestActions.innerHTML = "";

  if (guest.confirmed) {
    guestGreeting.textContent = `${guest.firstName}, bem-vindo(a) de volta!`;
    guestMessage.textContent = "Sua presença já está confirmada. Estamos muito felizes por celebrar este dia com você.";
    guestActions.appendChild(
      createActionButton("Entrar no site", "", () => closeModal(entryModal)),
    );
    return;
  }

  guestGreeting.textContent = `${guest.firstName}, que bom ter você aqui!`;
  guestMessage.textContent = `${guest.firstName}, posso confirmar sua presença para juntos celebrarmos a união de ${WEDDING_CONFIG.bride.firstName} e ${WEDDING_CONFIG.groom.firstName}?`;

  const confirmButton = createActionButton("Confirmar presença", "", async () => {
    setButtonLoading(confirmButton, true, "Confirmando…");
    try {
      await weddingApi.confirmPresence(guest.id);
      guest.confirmed = true;
      localStorage.setItem("wedding_guest", JSON.stringify(guest));
      showToast("Presença confirmada com sucesso!");
      showGuestResponse();
    } catch (error) {
      console.error(error);
      showToast("Não foi possível confirmar agora. Tente novamente.", "error");
      setButtonLoading(confirmButton, false);
    }
  });

  const laterButton = createActionButton("Confirmar outra hora", "button-outline", () => {
    closeModal(entryModal);
    showToast("Tudo bem. O botão de confirmação continuará disponível no site.");
  });

  guestActions.append(confirmButton, laterButton);
}

async function handleGuestEntry(event) {
  event.preventDefault();
  const fullName = guestNameInput.value.trim();
  if (fullName.length < 2) return;

  activateWeddingMusic();

  setButtonLoading(guestSubmitButton, true, "Entrando…");
  try {
    state.guest = await weddingApi.enterGuest(fullName);
    localStorage.setItem("wedding_guest", JSON.stringify(state.guest));
    showGuestResponse();
  } catch (error) {
    console.error(error);
    showToast("Não foi possível acessar agora. Verifique sua conexão e tente novamente.", "error");
  } finally {
    setButtonLoading(guestSubmitButton, false);
  }
}

function resetEntryModal() {
  entryFormView.classList.remove("hidden");
  entryResponseView.classList.add("hidden");
  guestActions.innerHTML = "";
  entryClose.classList.toggle("hidden", !state.guest);
  if (state.guest) showGuestResponse();
}

function openRsvp() {
  resetEntryModal();
  openModal(entryModal);
  if (!state.guest) setTimeout(() => guestNameInput.focus(), 50);
}

function giftCardTemplate(gift) {
  const article = document.createElement("article");
  article.className = `gift-card ${gift.isChosen ? "is-chosen" : ""}`;

  const imageWrap = document.createElement("div");
  imageWrap.className = "gift-image-wrap";

  const image = document.createElement("img");
  image.src = gift.imageUrl;
  image.alt = gift.name;
  image.loading = "lazy";
  image.onerror = () => {
    image.src = "./assets/gifts/presente.svg";
  };

  const status = document.createElement("span");
  status.className = `gift-status ${gift.isChosen ? "unavailable" : ""}`;
  status.textContent = gift.isChosen ? "Já escolhido" : "Disponível";
  imageWrap.append(image, status);

  const body = document.createElement("div");
  body.className = "gift-body";
  const title = document.createElement("h3");
  title.textContent = gift.name;
  const description = document.createElement("p");
  description.className = "gift-description";
  description.textContent = gift.description || "Um presente especial para o novo lar.";
  const price = document.createElement("p");
  price.className = "gift-price";
  price.textContent = formatMoney(gift.priceCents);
  const button = document.createElement("button");
  button.type = "button";
  button.className = "button full-width";
  button.disabled = gift.isChosen;
  button.textContent = gift.isChosen ? "Presente já escolhido" : "Eu irei dar este presente";
  button.addEventListener("click", () => openGiftConfirmation(gift));

  body.append(title, description, price, button);
  article.append(imageWrap, body);
  return article;
}

function renderGifts() {
  const grid = $("#gifts-grid");
  grid.innerHTML = "";
  state.gifts.forEach((gift) => grid.appendChild(giftCardTemplate(gift)));
  $("#gifts-empty").classList.toggle("hidden", state.gifts.length > 0);
}

async function loadGifts({ quiet = false } = {}) {
  if (!quiet) $("#gifts-loading").classList.remove("hidden");
  try {
    state.gifts = await weddingApi.listGifts();
    renderGifts();
  } catch (error) {
    console.error(error);
    if (!quiet) showToast("Não foi possível carregar os presentes.", "error");
  } finally {
    $("#gifts-loading").classList.add("hidden");
  }
}

function openGiftConfirmation(gift) {
  if (!state.guest) {
    showToast("Digite seu nome antes de escolher um presente.");
    openRsvp();
    return;
  }

  state.selectedGift = gift;
  giftConfirmMessage.textContent = `${state.guest.firstName}, tem certeza de que deseja presentear o casal com “${gift.name}”?`;
  giftConfirmActions.classList.remove("hidden");
  giftThanksView.classList.add("hidden");
  manualWhatsappButton.classList.add("hidden");
  openModal(giftConfirmModal);
}

function whatsappUrl(guestFirstName, giftName) {
  const number = WEDDING_CONFIG.brideWhatsappNumber.replace(/\D/g, "");
  const message = `${guestFirstName} escolheu te dar o presente “${giftName}”.`;
  return number ? `https://wa.me/${number}?text=${encodeURIComponent(message)}` : "";
}

async function confirmGiftChoice() {
  if (!state.selectedGift || !state.guest) return;
  const button = $("#confirm-gift-button");
  setButtonLoading(button, true, "Reservando…");

  try {
    const result = await weddingApi.chooseGift(state.selectedGift.id, state.guest.id);
    if (!result.success) {
      await loadGifts({ quiet: true });
      closeModal(giftConfirmModal);
      showToast("Este presente acabou de ser escolhido por outra pessoa.", "error");
      return;
    }

    const chosenGiftName = result.giftName || state.selectedGift.name;
    const purchaseUrl = result.purchaseUrl || state.selectedGift.purchaseUrl;
    giftConfirmActions.classList.add("hidden");
    giftThanksView.classList.remove("hidden");
    giftThanksMessage.textContent = `${state.guest.firstName}, o presente “${chosenGiftName}” foi reservado em seu nome.`;

    if (purchaseUrl && purchaseUrl !== "#") {
      giftPurchaseLink.href = purchaseUrl;
      giftPurchaseLink.classList.remove("hidden");
    } else {
      giftPurchaseLink.classList.add("hidden");
    }

    try {
      const notification = await weddingApi.notifyBride(state.selectedGift.id, state.guest.id);

      if (notification.automatic && notification.sent) {
        manualWhatsappButton.classList.add("hidden");
        showToast("Presente reservado e a noiva foi avisada automaticamente!");
      } else {
        throw new Error("A função não confirmou o envio da mensagem.");
      }
    } catch (notifyError) {
      console.error("Falha ao notificar a noiva:", notifyError);
      const fallbackUrl = whatsappUrl(state.guest.firstName, chosenGiftName);

      if (fallbackUrl) {
        manualWhatsappButton.classList.remove("hidden");
        manualWhatsappButton.textContent = "Avisar no WhatsApp";
        manualWhatsappButton.onclick = () =>
          window.open(fallbackUrl, "_blank", "noopener,noreferrer");
      }

      showToast(
        "O presente foi reservado, mas o WhatsApp automático ainda não está configurado corretamente.",
        "error",
      );
    }

    await loadGifts({ quiet: true });
  } catch (error) {
    console.error(error);
    showToast("Não foi possível reservar o presente. Tente novamente.", "error");
  } finally {
    setButtonLoading(button, false);
  }
}

function updateCountdown() {
  const target = new Date(WEDDING_CONFIG.dateISO).getTime();
  const diff = Math.max(0, target - Date.now());
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff / 3600000) % 24);
  const minutes = Math.floor((diff / 60000) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  $("#days").textContent = String(days).padStart(3, "0");
  $("#hours").textContent = String(hours).padStart(2, "0");
  $("#minutes").textContent = String(minutes).padStart(2, "0");
  $("#seconds").textContent = String(seconds).padStart(2, "0");
}

function restoreGuest() {
  try {
    const saved = localStorage.getItem("wedding_guest");
    if (saved) state.guest = JSON.parse(saved);
  } catch {
    localStorage.removeItem("wedding_guest");
  }
}

function bindEvents() {
  guestNameForm.addEventListener("submit", handleGuestEntry);
  entryClose.addEventListener("click", () => closeModal(entryModal));
  $("#open-rsvp-button").addEventListener("click", openRsvp);
  $("#hero-rsvp-button").addEventListener("click", openRsvp);

  $("#gift-confirm-close").addEventListener("click", () => closeModal(giftConfirmModal));
  $("#cancel-gift-button").addEventListener("click", () => closeModal(giftConfirmModal));
  $("#confirm-gift-button").addEventListener("click", confirmGiftChoice);

  $("#open-invitation-button").addEventListener("click", () => openModal($("#invitation-modal")));
  $("#invitation-close").addEventListener("click", () => closeModal($("#invitation-modal")));

  $$(".modal-backdrop").forEach((modal) => {
    modal.addEventListener("click", (event) => {
      if (event.target === modal && modal !== entryModal) closeModal(modal);
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const opened = $$(".modal-backdrop:not(.hidden)").at(-1);
    if (opened && opened !== entryModal) closeModal(opened);
  });
}

async function init() {
  fillWeddingContent();
  loadYouTubePlayer();
  restoreGuest();
  bindEvents();
  updateCountdown();
  setInterval(updateCountdown, 1000);
  $("#demo-mode-banner").classList.toggle("hidden", weddingApi.mode !== "demo");
  await loadGifts();
  setInterval(() => loadGifts({ quiet: true }), WEDDING_CONFIG.refreshGiftsEveryMs);
  openRsvp();
}

init();
