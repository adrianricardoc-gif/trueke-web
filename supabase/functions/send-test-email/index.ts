import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  provider: "resend" | "sendgrid" | "smtp";
  senderEmail: string;
  senderName: string;
  // Provider-specific
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  smtpSecure?: boolean;
  resendApiKey?: string;
  sendgridApiKey?: string;
}

const getEmailHtml = (senderName: string, senderEmail: string, provider: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #F97316, #EAB308); padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
    .success { background: #10B981; color: white; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 20px; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
    .provider-badge { display: inline-block; background: #e5e7eb; padding: 4px 12px; border-radius: 9999px; font-size: 12px; margin-top: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✉️ Trueke</h1>
    </div>
    <div class="content">
      <div class="success">
        ✅ ¡Correo de prueba enviado exitosamente!
      </div>
      <p>Este es un correo de prueba para verificar que la configuración de correo está funcionando correctamente.</p>
      <p><strong>Detalles de la configuración:</strong></p>
      <ul>
        <li>Remitente: ${senderName}</li>
        <li>Correo: ${senderEmail}</li>
        <li>Proveedor: <span class="provider-badge">${provider.toUpperCase()}</span></li>
        <li>Fecha: ${new Date().toLocaleString('es-EC')}</li>
      </ul>
      <p>Si recibiste este correo, significa que las notificaciones por email están configuradas correctamente. 🎉</p>
    </div>
    <div class="footer">
      <p>Este es un correo automático de prueba de Trueke.</p>
    </div>
  </div>
</body>
</html>
`;

async function sendWithResend(req: EmailRequest): Promise<any> {
  const apiKey = req.resendApiKey || Deno.env.get("RESEND_API_KEY");
  if (!apiKey) throw new Error("No se ha configurado la API Key de Resend");

  const resend = new Resend(apiKey);
  return await resend.emails.send({
    from: `${req.senderName} <${req.senderEmail}>`,
    to: [req.to],
    subject: "🧪 Correo de Prueba - Trueke",
    html: getEmailHtml(req.senderName, req.senderEmail, "resend"),
  });
}

async function sendWithSendGrid(req: EmailRequest): Promise<any> {
  const apiKey = req.sendgridApiKey;
  if (!apiKey) throw new Error("No se ha configurado la API Key de SendGrid");

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: req.to }] }],
      from: { email: req.senderEmail, name: req.senderName },
      subject: "🧪 Correo de Prueba - Trueke",
      content: [{ type: "text/html", value: getEmailHtml(req.senderName, req.senderEmail, "sendgrid") }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SendGrid error: ${error}`);
  }

  return { success: true };
}

async function sendWithSMTP(req: EmailRequest): Promise<any> {
  if (!req.smtpHost || !req.smtpUser || !req.smtpPassword) {
    throw new Error("Configuración SMTP incompleta");
  }

  // Use external SMTP service via HTTP API (since Deno doesn't have native SMTP)
  // We'll use a simple HTTP-to-SMTP bridge approach or direct socket connection
  // For simplicity, we'll simulate SMTP via nodemailer-compatible service
  
  // Alternative: Use a third-party SMTP relay API
  // For this implementation, we'll encode and send via a basic approach
  
  const smtpConfig = {
    host: req.smtpHost,
    port: req.smtpPort || 587,
    user: req.smtpUser,
    password: req.smtpPassword,
    secure: req.smtpSecure ?? true,
  };

  // Since Deno Edge Functions don't support direct SMTP, 
  // we'll use the SMTPClient from deno_smtp or a workaround
  // For now, we'll throw an informative error or use an alternative
  
  try {
    // Try using denopkg smtp client
    const { SMTPClient } = await import("https://deno.land/x/denomailer@1.6.0/mod.ts");
    
    const client = new SMTPClient({
      connection: {
        hostname: smtpConfig.host,
        port: smtpConfig.port,
        tls: smtpConfig.secure,
        auth: {
          username: smtpConfig.user,
          password: smtpConfig.password,
        },
      },
    });

    await client.send({
      from: `${req.senderName} <${req.senderEmail}>`,
      to: req.to,
      subject: "🧪 Correo de Prueba - Trueke",
      content: "auto",
      html: getEmailHtml(req.senderName, req.senderEmail, "smtp"),
    });

    await client.close();
    return { success: true };
  } catch (smtpError: any) {
    console.error("SMTP Error:", smtpError);
    throw new Error(`Error SMTP: ${smtpError.message}. Verifica las credenciales y configuración del servidor.`);
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const emailReq: EmailRequest = await req.json();

    if (!emailReq.to || !emailReq.senderEmail) {
      throw new Error("Missing required fields: to, senderEmail");
    }

    console.log(`Sending test email to ${emailReq.to} via ${emailReq.provider}`);

    let result;
    switch (emailReq.provider) {
      case "resend":
        result = await sendWithResend(emailReq);
        break;
      case "sendgrid":
        result = await sendWithSendGrid(emailReq);
        break;
      case "smtp":
        result = await sendWithSMTP(emailReq);
        break;
      default:
        throw new Error(`Proveedor no soportado: ${emailReq.provider}`);
    }

    console.log("Test email sent successfully:", result);

    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending test email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
