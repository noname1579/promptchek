/**
 * app/share/[slug]/page.tsx
 * Server Component: страница публичного shared template.
 * Генерирует metadata для SEO.
 */

import { notFound } from "next/navigation";
import { getSharedTemplate } from "@/lib/store";
import { SharedTemplateView } from "@/components/share/SharedTemplateView";

// --- Metadata ---

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const template = await getSharedTemplate(slug);

  if (!template) {
    return {
      title: "Template Not Found",
      description: "Shared template not found.",
    };
  }

  return {
    title: `${template.title} — Shared Prompt | PromptCraft Pro`,
    description: template.prompt.slice(0, 160),
  };
}

// --- Page ---

export default async function SharedTemplatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const template = await getSharedTemplate(slug);

  if (!template) {
    notFound();
  }

  return <SharedTemplateView template={template} />;
}
