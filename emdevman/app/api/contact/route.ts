import { NextResponse } from "next/server";

import { EMAIL_ADDRESS } from "../../lib/contact";

const MAX_NAME_LENGTH = 80;
const MAX_EMAIL_LENGTH = 254;
const MAX_MESSAGE_LENGTH = 2000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ContactPayload {
  name?: unknown;
  email?: unknown;
  message?: unknown;
  website?: unknown;
}

function isValidEmail(value: string) {
  return value.length <= MAX_EMAIL_LENGTH && EMAIL_PATTERN.test(value);
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 20_000) {
    return NextResponse.json({ error: "Message is too large." }, { status: 413 });
  }

  let payload: ContactPayload;
  try {
    payload = (await request.json()) as ContactPayload;
  } catch {
    return NextResponse.json({ error: "Please send a valid form submission." }, { status: 400 });
  }

  // Honeypot submissions are acknowledged without sending an email.
  if (typeof payload.website === "string" && payload.website.trim()) {
    return NextResponse.json({ ok: true });
  }

  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  const message = typeof payload.message === "string" ? payload.message.trim() : "";

  if (name.length < 2 || name.length > MAX_NAME_LENGTH) {
    return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  if (message.length < 20 || message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: "Please include a message between 20 and 2,000 characters." },
      { status: 400 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "The contact form is not configured yet. Please use the email link below." },
      { status: 503 },
    );
  }

  const recipient = process.env.CONTACT_TO_EMAIL ?? EMAIL_ADDRESS;
  const sender = process.env.RESEND_FROM_EMAIL ?? "Emmanuel Bitancor Portfolio <onboarding@resend.dev>";

  try {
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: sender,
        to: [recipient],
        reply_to: email,
        subject: `Portfolio inquiry from ${name}`,
        text: [
          "New portfolio contact form submission",
          "",
          `Name: ${name}`,
          `Reply-to: ${email}`,
          "",
          message,
        ].join("\n"),
      }),
    });

    if (!resendResponse.ok) {
      console.error("Resend contact form request failed", resendResponse.status);
      return NextResponse.json(
        { error: "The message could not be sent right now. Please use the email link below." },
        { status: 502 },
      );
    }
  } catch (error) {
    console.error("Resend contact form request failed", error);
    return NextResponse.json(
      { error: "The message could not be sent right now. Please use the email link below." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
