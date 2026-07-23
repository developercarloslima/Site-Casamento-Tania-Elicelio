import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json({ error: "Método não permitido" }, 405);
  }

  try {
    const { giftId, guestId } = await request.json();

    if (!giftId || !guestId) {
      return json({ error: "giftId e guestId são obrigatórios" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const whatsappToken = Deno.env.get("WHATSAPP_TOKEN");
    const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
    const brideNumber = Deno.env.get("BRIDE_WHATSAPP_NUMBER")?.replace(/\D/g, "");
    const templateName =
      Deno.env.get("WHATSAPP_TEMPLATE_NAME") || "presente_casamento_escolhido";
    const templateLanguage =
      Deno.env.get("WHATSAPP_TEMPLATE_LANGUAGE") || "pt_BR";
    const graphVersion = Deno.env.get("WHATSAPP_GRAPH_API_VERSION") || "v24.0";

    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: "Supabase não configurado na função" }, 500);
    }

    if (!whatsappToken || !phoneNumberId || !brideNumber) {
      return json(
        {
          error: "WhatsApp Cloud API não configurada",
          missing: {
            WHATSAPP_TOKEN: !whatsappToken,
            WHATSAPP_PHONE_NUMBER_ID: !phoneNumberId,
            BRIDE_WHATSAPP_NUMBER: !brideNumber,
          },
        },
        503,
      );
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const [{ data: gift, error: giftError }, { data: guest, error: guestError }] =
      await Promise.all([
        admin
          .from("gifts")
          .select("id,name,chosen_by,notification_sent_at")
          .eq("id", giftId)
          .single(),
        admin
          .from("guests")
          .select("id,first_name,full_name")
          .eq("id", guestId)
          .single(),
      ]);

    if (giftError || guestError || !gift || !guest) {
      console.error("Reserva não encontrada", { giftError, guestError });
      return json({ error: "Reserva não encontrada" }, 404);
    }

    if (gift.chosen_by !== guest.id) {
      return json({ error: "O presente não pertence a este convidado" }, 403);
    }

    if (gift.notification_sent_at) {
      return json({ sent: true, alreadySent: true });
    }

    // O template aprovado no WhatsApp Manager deve ter exatamente dois parâmetros:
    // "{{1}} escolheu te dar o presente {{2}}."
    const metaResponse = await fetch(
      `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${whatsappToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: brideNumber,
          type: "template",
          template: {
            name: templateName,
            language: { code: templateLanguage },
            components: [
              {
                type: "body",
                parameters: [
                  { type: "text", text: guest.first_name },
                  { type: "text", text: gift.name },
                ],
              },
            ],
          },
        }),
      },
    );

    const metaBody = await metaResponse.json().catch(() => ({}));

    if (!metaResponse.ok) {
      console.error("Erro retornado pela Meta:", metaBody);
      return json(
        {
          error: "Falha ao enviar WhatsApp",
          details: metaBody,
        },
        502,
      );
    }

    const messageId = metaBody?.messages?.[0]?.id || null;

    const { error: updateError } = await admin
      .from("gifts")
      .update({ notification_sent_at: new Date().toISOString() })
      .eq("id", gift.id)
      .eq("chosen_by", guest.id)
      .is("notification_sent_at", null);

    if (updateError) {
      console.error(
        "Mensagem enviada, mas não foi possível registrar o status:",
        updateError,
      );
    }

    return json({
      sent: true,
      messageId,
      message: `${guest.first_name} escolheu te dar o presente ${gift.name}.`,
    });
  } catch (error) {
    console.error("Erro interno da função:", error);
    return json({ error: "Erro interno da função" }, 500);
  }
});
