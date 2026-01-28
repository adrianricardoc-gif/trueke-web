import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper to send email via Resend
async function sendEmail(to: string, subject: string, html: string) {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.error("RESEND_API_KEY not configured");
    return false;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Trueke <noreply@trueke.app>",
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Resend API error:", error);
    return false;
  }

  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

    // Get products expiring in 3 days (not yet notified)
    const { data: productsExpiring3Days, error: error3Days } = await supabase
      .from("products")
      .select("id, title, expires_at, user_id")
      .eq("status", "active")
      .eq("expiry_notified_3days", false)
      .lte("expires_at", threeDaysFromNow.toISOString())
      .gt("expires_at", oneDayFromNow.toISOString());

    if (error3Days) {
      console.error("Error fetching 3-day expiring products:", error3Days);
    }

    // Get products expiring in 1 day (not yet notified)
    const { data: productsExpiring1Day, error: error1Day } = await supabase
      .from("products")
      .select("id, title, expires_at, user_id")
      .eq("status", "active")
      .eq("expiry_notified_1day", false)
      .lte("expires_at", oneDayFromNow.toISOString())
      .gt("expires_at", now.toISOString());

    if (error1Day) {
      console.error("Error fetching 1-day expiring products:", error1Day);
    }

    let notificationsSent = 0;

    // Process 3-day notifications
    if (productsExpiring3Days && productsExpiring3Days.length > 0) {
      for (const product of productsExpiring3Days) {
        const { data: userData } = await supabase.auth.admin.getUserById(product.user_id);
        
        if (userData?.user?.email) {
          const emailSent = await sendEmail(
            userData.user.email,
            `⏰ Tu publicación "${product.title}" expira en 3 días`,
            `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #FF6B35;">¡Hola!</h1>
                <p>Tu publicación <strong>"${product.title}"</strong> expirará en <strong>3 días</strong>.</p>
                <p>Si aún quieres intercambiar este producto, puedes renovar la publicación desde la app.</p>
                <a href="https://trueke.app/my-products" style="display: inline-block; background: linear-gradient(135deg, #FF6B35, #E91E63); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 16px;">
                  Renovar Publicación
                </a>
                <p style="color: #666; margin-top: 24px; font-size: 14px;">
                  Si ya no deseas intercambiar este producto, puedes ignorar este mensaje.
                </p>
              </div>
            `
          );

          if (emailSent) {
            await supabase
              .from("products")
              .update({ expiry_notified_3days: true })
              .eq("id", product.id);
            notificationsSent++;
          }
        }
      }
    }

    // Process 1-day notifications
    if (productsExpiring1Day && productsExpiring1Day.length > 0) {
      for (const product of productsExpiring1Day) {
        const { data: userData } = await supabase.auth.admin.getUserById(product.user_id);
        
        if (userData?.user?.email) {
          const emailSent = await sendEmail(
            userData.user.email,
            `🚨 ¡Última oportunidad! "${product.title}" expira MAÑANA`,
            `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #E91E63;">⚠️ ¡Atención!</h1>
                <p>Tu publicación <strong>"${product.title}"</strong> expirará <strong>MAÑANA</strong>.</p>
                <p>Después de eso, dejará de aparecer en las búsquedas y no podrás recibir más ofertas.</p>
                <a href="https://trueke.app/my-products" style="display: inline-block; background: linear-gradient(135deg, #FF6B35, #E91E63); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 16px;">
                  ¡Renovar Ahora!
                </a>
                <p style="color: #666; margin-top: 24px; font-size: 14px;">
                  Renovar es gratis y toma solo unos segundos.
                </p>
              </div>
            `
          );

          if (emailSent) {
            await supabase
              .from("products")
              .update({ expiry_notified_1day: true })
              .eq("id", product.id);
            notificationsSent++;
          }
        }
      }
    }

    // Mark expired products as inactive
    const { data: expiredProducts, error: expireError } = await supabase
      .from("products")
      .update({ status: "expired" })
      .eq("status", "active")
      .lt("expires_at", now.toISOString())
      .select("id");

    if (expireError) {
      console.error("Error marking products as expired:", expireError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        notificationsSent,
        productsExpired: expiredProducts?.length || 0,
        timestamp: now.toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in product-expiry-notify:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
