"use client";

import { useId, useState, type FormEvent } from "react";
import { CheckCircle2, LoaderCircle, Send } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";

interface FormValues {
  name: string;
  email: string;
  message: string;
  website: string;
}

type SubmitState = "idle" | "submitting" | "success" | "error";

export default function ContactForm() {
  const formPrefix = useId().replace(/:/g, "");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const values: FormValues = {
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      message: String(formData.get("message") ?? "").trim(),
      website: String(formData.get("website") ?? "").trim(),
    };

    setSubmitState("submitting");
    setErrorMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(result?.error ?? "Something went wrong. Please try again.");
      }

      form.reset();
      setSubmitState("success");
    } catch (error) {
      setSubmitState("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    }
  };

  const isSubmitting = submitState === "submitting";

  return (
    <Card className="overflow-hidden">
      <form
        onSubmit={handleSubmit}
        className="p-5 sm:p-7"
        aria-describedby={`${formPrefix}-status`}
      >
        <div className="mb-6">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Send a message
          </p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-card-foreground">
            Tell me a little about your idea.
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            I&apos;ll get back to you as soon as I can.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor={`${formPrefix}-name`}>Name</Label>
            <Input
              id={`${formPrefix}-name`}
              name="name"
              type="text"
              autoComplete="name"
              required
              minLength={2}
              maxLength={80}
              placeholder="Your name"
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor={`${formPrefix}-email`}>Email</Label>
            <Input
              id={`${formPrefix}-email`}
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              placeholder="you@example.com"
              className="mt-2"
            />
          </div>
        </div>

        <div className="mt-5">
          <Label htmlFor={`${formPrefix}-message`}>Message</Label>
          <Textarea
            id={`${formPrefix}-message`}
            name="message"
            required
            minLength={20}
            maxLength={2000}
            rows={6}
            placeholder="What would you like to build?"
            className="mt-2 min-h-36 resize-y"
            aria-describedby={`${formPrefix}-message-hint`}
          />
          <div className="mt-2 flex justify-between gap-4 text-xs text-muted-foreground">
            <span id={`${formPrefix}-message-hint`}>Please include a little context.</span>
            <span>Max 2,000 characters</span>
          </div>
        </div>

        <div className="absolute -left-[10000px] top-auto size-px overflow-hidden" aria-hidden="true">
          <label htmlFor={`${formPrefix}-website`}>Website</label>
          <input id={`${formPrefix}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        <Button type="submit" size="lg" disabled={isSubmitting} className="mt-6 w-full sm:w-auto">
          {isSubmitting ? (
            <>
              <LoaderCircle className="animate-spin" aria-hidden="true" />
              Sending…
            </>
          ) : (
            <>
              <Send aria-hidden="true" />
              Send message
            </>
          )}
        </Button>

        <div id={`${formPrefix}-status`} className="mt-4 min-h-5 text-sm" aria-live="polite">
          {submitState === "success" && (
            <p className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-4" aria-hidden="true" />
              Thanks — your message was sent successfully.
            </p>
          )}
          {submitState === "error" && (
            <p className="text-destructive" role="alert">
              {errorMessage}
            </p>
          )}
        </div>
      </form>
    </Card>
  );
}
