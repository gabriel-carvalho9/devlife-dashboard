const VAPID_PUBLIC_KEY =
  "BLxnaYsMn69rmEwfrYKism0Dg2I6bk_RqpXdsOjffyUIPMgvXIbOG1BDiaP2UVnCmFmjF0gSgrEkIylupwjrC1Q";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function suportaNotificacoes() {
  return "Notification" in window && "serviceWorker" in navigator;
}

export async function ativarNotificacoes() {
  if (!suportaNotificacoes()) return { ok: false, motivo: "sem-suporte" };

  const permissao = await Notification.requestPermission();
  if (permissao !== "granted") return { ok: false, motivo: "negada" };

  const registro = await navigator.serviceWorker.ready;

  try {
    let subscription = await registro.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    console.log("📬 Inscrição de push criada:", subscription.endpoint);
    return { ok: true, subscription };
  } catch (erro) {
    console.warn(
      "⚠️ Inscrição de Push não criada. As notificações locais continuam disponíveis:",
      erro
    );
    return { ok: true, subscription: null, pushIndisponivel: true };
  }
}

export async function notificarLocal(titulo, opcoes = {}) {
  if (!suportaNotificacoes()) {
    console.warn("Notificações não são suportadas neste navegador.");
    return false;
  }

  if (Notification.permission !== "granted") {
    console.warn("Permissão de notificação não concedida.");
    return false;
  }

  try {
    const registro = await navigator.serviceWorker.ready;

    await registro.showNotification(titulo, {
      body: opcoes.body || "",
      ...opcoes,
    });

    console.log("🔔 Notificação exibida pelo Service Worker.");
    return true;
  } catch (erro) {
    console.warn(
      "Service Worker não conseguiu exibir a notificação. Tentando API do navegador:",
      erro
    );

    try {
      new Notification(titulo, opcoes);
      console.log("🔔 Notificação exibida pela API Notification.");
      return true;
    } catch (erroFallback) {
      console.error("Não foi possível exibir a notificação:", erroFallback);
      return false;
    }
  }
}