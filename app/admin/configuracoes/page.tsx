import { Lightbulb, MessageCircle, Phone } from "lucide-react";

import { AdminNotice } from "@/components/admin/admin-notice";
import { AdminShell } from "@/components/admin/admin-shell";
import { SubmitButton } from "@/components/admin/submit-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateWhatsAppNumber } from "@/lib/admin-actions";
import { getAdminSiteSettings } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

type SettingsAdminPageProps = {
  searchParams?: Promise<{
    success?: string;
    error?: string;
  }>;
};

function formatWhatsAppNumber(value: string) {
  if (!value) {
    return "Nao configurado";
  }

  if (value.length === 13 && value.startsWith("55")) {
    return `+55 (${value.slice(2, 4)}) ${value.slice(4, 9)}-${value.slice(9)}`;
  }

  return `+${value}`;
}

export default async function SettingsAdminPage({ searchParams }: SettingsAdminPageProps) {
  await requireAdmin();
  const resolvedSearchParams = (await searchParams) ?? {};
  const settings = await getAdminSiteSettings();

  return (
    <AdminShell>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Configuracoes</h1>
        <p className="text-sm text-muted-foreground">
          Ajustes simples que mudam o comportamento do catalogo publicado.
        </p>
      </div>

      <AdminNotice success={resolvedSearchParams.success} error={resolvedSearchParams.error} />

      {settings.setupMissing ? (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Reaplique o arquivo `supabase.sql` no Supabase para habilitar configuracoes editaveis
          pelo admin. Ate la, o catalogo usa o numero do `.env`.
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>WhatsApp do catalogo</CardTitle>
                <CardDescription>
                  Esse numero recebe as mensagens abertas pelo botao flutuante e pelas paginas de produto.
                </CardDescription>
              </div>
              <MessageCircle data-icon="inline-start" />
            </div>
          </CardHeader>
          <CardContent>
            <form action={updateWhatsAppNumber} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="whatsapp_number">Numero com DDI e DDD</Label>
                <Input
                  id="whatsapp_number"
                  name="whatsapp_number"
                  inputMode="tel"
                  placeholder="5553981169371"
                  defaultValue={settings.whatsappNumber}
                  disabled={settings.setupMissing}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Pode digitar com parenteses, espacos ou hifen. O sistema salva somente os numeros.
                </p>
              </div>

              <div className="rounded-md border bg-muted/40 p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Numero em uso</span>
                  <Badge variant="secondary">
                    {settings.whatsappNumberSource === "database" ? "Admin" : ".env"}
                  </Badge>
                </div>
                <p className="mt-2 font-medium">{formatWhatsAppNumber(settings.whatsappNumber)}</p>
              </div>

              <SubmitButton
                type="submit"
                pendingLabel="Salvando..."
                disabled={settings.setupMissing}
              >
                <Phone data-icon="inline-start" />
                Salvar WhatsApp
              </SubmitButton>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Complementos bons</CardTitle>
            <CardDescription>Ideias pequenas que deixam a loja mais profissional.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <div className="flex gap-3 rounded-md border p-3">
              <Lightbulb data-icon="inline-start" />
              <p>Mensagem padrao editavel para campanha, como lancamento ou horario de atendimento.</p>
            </div>
            <div className="flex gap-3 rounded-md border p-3">
              <Lightbulb data-icon="inline-start" />
              <p>Horario de atendimento visivel perto do WhatsApp, para alinhar expectativa do cliente.</p>
            </div>
            <div className="flex gap-3 rounded-md border p-3">
              <Lightbulb data-icon="inline-start" />
              <p>Numero alternativo por categoria no futuro, se houver vendedores ou canais diferentes.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
