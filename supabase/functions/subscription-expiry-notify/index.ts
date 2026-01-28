import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sendEmail(to: string, subject: string, html: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Trueke <noreply@trueke.lovable.app>",
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend error: ${error}`);
  }

  return response.json();
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find subscriptions expiring in 3 days that haven't been notified
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    const oneDayFromNow = new Date();
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);

    // Get expiring subscriptions (between 1 and 3 days from now)
    const { data: expiringSubscriptions, error: subError } = await supabase
      .from("user_subscriptions")
      .select(`
        id,
        user_id,
        expires_at,
        expiry_notified_at,
        plan:premium_plans(name, price)
      `)
      .eq("status", "active")
      .lte("expires_at", threeDaysFromNow.toISOString())
      .gte("expires_at", oneDayFromNow.toISOString())
      .is("expiry_notified_at", null);

    if (subError) {
      console.error("Error fetching subscriptions:", subError);
      throw subError;
    }

    console.log(`Found ${expiringSubscriptions?.length || 0} expiring subscriptions`);

    const results: Array<{ email: string; status: string; error?: string }> = [];

    for (const subscription of expiringSubscriptions || []) {
      // Get user's profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", subscription.user_id)
        .single();

      // Get user's email
      const { data: userData } = await supabase.auth.admin.getUserById(subscription.user_id);
      
      if (!userData?.user?.email) {
        console.log(`No email for user ${subscription.user_id}`);
        continue;
      }

      const userEmail = userData.user.email;
      const userName = profile?.display_name || userEmail.split("@")[0];
      const plan = subscription.plan as unknown as { name: string; price: number } | null;
      const planName = plan?.name || "Premium";
      const expiryDate = new Date(subscription.expires_at!).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      const daysUntilExpiry = Math.ceil(
        (new Date(subscription.expires_at!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #FF6B35 0%, #F72585 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🔔 Aviso de Vencimiento</h1>
            </div>
            <div style="padding: 30px;">
              <p style="font-size: 18px; color: #333;">Hola <strong>${userName}</strong>,</p>
              <p style="color: #666; line-height: 1.6;">
                Queremos recordarte que tu suscripción al plan <strong style="color: #FF6B35;">${planName}</strong> 
                vencerá el <strong>${expiryDate}</strong>.
              </p>
              <div style="background: #FFF3CD; border-left: 4px solid #FFC107; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #856404;">
                  ⏰ Te quedan <strong>${daysUntilExpiry} día${daysUntilExpiry > 1 ? "s" : ""}</strong> para renovar.
                </p>
              </div>
              <ul style="color: #666; line-height: 2;">
                <li>Mayor visibilidad para tus productos</li>
                <li>Productos destacados en el feed</li>
                <li>Insignia Premium visible</li>
                <li>Analytics avanzados</li>
              </ul>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://trueke.lovable.app/profile" 
                   style="display: inline-block; background: linear-gradient(135deg, #FF6B35 0%, #F72585 100%); 
                          color: white; text-decoration: none; padding: 14px 40px; 
                          border-radius: 30px; font-weight: bold; font-size: 16px;">
                  Renovar Ahora
                </a>
              </div>
            </div>
            <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
              <p style="margin: 0; color: #999; font-size: 12px;">
                © 2026 Trueke - Intercambia lo que tienes por lo que quieres
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      try {
        const emailResponse = await sendEmail(
          userEmail,
          `Tu plan ${planName} vence en ${daysUntilExpiry} día${daysUntilExpiry > 1 ? "s" : ""}`,
          emailHtml
        );

        console.log(`Email sent to ${userEmail}:`, emailResponse);

        // Mark as notified
        await supabase
          .from("user_subscriptions")
          .update({ expiry_notified_at: new Date().toISOString() })
          .eq("id", subscription.id);

        results.push({ email: userEmail, status: "sent" });
      } catch (emailError: unknown) {
        const errorMessage = emailError instanceof Error ? emailError.message : "Unknown error";
        console.error(`Error sending email to ${userEmail}:`, emailError);
        results.push({ email: userEmail, status: "error", error: errorMessage });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: results.length,
        results 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in subscription-expiry-notify:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
