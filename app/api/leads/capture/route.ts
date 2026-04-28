import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase-admin";

const resend = new Resend(process.env.RESEND_API_KEY);

// ─── IP rate limiting: 10 per IP per hour ────────────────────────────────────

interface RateLimitEntry { count: number; resetTime: number }
const leadRateMap = new Map<string, RateLimitEntry>();
const LEAD_RATE_LIMIT_MAX = 10;
const LEAD_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkLeadRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = leadRateMap.get(ip);
  if (!entry || now > entry.resetTime) {
    leadRateMap.set(ip, { count: 1, resetTime: now + LEAD_RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= LEAD_RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

// ─── Email validation ─────────────────────────────────────────────────────────

function isValidEmail(email: string): boolean {
  if (email.length > 254) return false;
  const atIdx = email.indexOf("@");
  if (atIdx < 1) return false;
  const domain = email.slice(atIdx + 1);
  return domain.includes(".") && domain.length > 2;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!checkLeadRateLimit(ip)) {
    return NextResponse.json(
      { error: "rate_limit", message: "Too many requests. Try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();

    // Sanitize and validate email
    const email = typeof body.email === "string" ? body.email.trim() : "";
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    // Sanitize domain
    const domain =
      typeof body.domain === "string" ? body.domain.trim().slice(0, 100) : null;

    // Sanitize score
    const rawScore = typeof body.score === "number" ? body.score : Number(body.score);
    const score =
      !isNaN(rawScore) && rawScore >= 0 && rawScore <= 100 ? rawScore : null;

    console.log(`[leads/capture] email="${email}" domain="${domain}" score=${score}`);

    // Send notification email — fire and forget
    resend.emails.send({
      from: "sparrwo@boringmonkee.com",
      to: "vishal@boringmonkee.com",
      subject: "New sparrwo Lead",
      text: [
        "New scan completed!",
        "",
        `Email: ${email}`,
        `Domain: ${domain}`,
        `Score: ${score}/100`,
        `Time: ${new Date().toISOString()}`,
      ].join("\n"),
    }).catch((err: unknown) => {
      console.error("[leads/capture] Resend error:", err);
    });

    // Add contact to Resend — triggers AIO Checker email sequence
    resend.contacts.create({
      email,
      audienceId: 'c27baf71-4917-4f2b-8cd8-8f02387c1ffb',
      unsubscribed: false,
    }).catch((err: unknown) => {
      console.error('[leads/capture] Resend contact error:', err);
    });

    // Save lead to Supabase
    await supabaseAdmin
      .from("leads")
      .insert({ email, domain, score })
      .then(({ error }) => {
        if (error) console.error("[leads/capture] Supabase insert error:", error);
      });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
