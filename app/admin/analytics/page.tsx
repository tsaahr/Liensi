import Link from "next/link";
import type { ReactNode } from "react";
import { BarChart3, Eye, MousePointerClick, Send, Users } from "lucide-react";

import { AdminShell } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { analyticsEventLabels } from "@/lib/analytics";
import { getAdminAnalytics, type AdminAnalyticsSummary } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { formatProductName } from "@/lib/utils";

export const dynamic = "force-dynamic";

type AnalyticsPageProps = {
  searchParams?: Promise<{
    days?: string;
  }>;
};

const periodOptions = [7, 30, 90];

function getPeriod(value?: string) {
  const days = Number(value);
  return periodOptions.includes(days) ? days : 30;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function MetricCard({
  title,
  value,
  description,
  icon
}: {
  title: string;
  value: number;
  description: string;
  icon: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function SetupNotice({ message }: { message: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analytics ainda nao esta pronto no Supabase</CardTitle>
        <CardDescription>
          Rode novamente o arquivo `supabase.sql` no SQL Editor para criar a tabela
          `analytics_events` e as policies.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {message}
        </p>
      </CardContent>
    </Card>
  );
}

function AnalyticsContent({ analytics }: { analytics: AdminAnalyticsSummary }) {
  return (
    <>
      {analytics.limit_reached ? (
        <div className="mb-4 rounded-md border bg-background p-3 text-sm text-muted-foreground">
          Mostrando os 5.000 eventos mais recentes do periodo. Quando o volume crescer, vale
          criar agregacoes no banco.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          title="Visitantes unicos"
          value={analytics.unique_visitors}
          description={`Desde ${formatDate(analytics.since)}.`}
          icon={<Users data-icon="inline-start" />}
        />
        <MetricCard
          title="Catalogo"
          value={analytics.event_counts.catalog_view}
          description={`${analytics.unique_event_visitors.catalog_view} visitantes unicos.`}
          icon={<Eye data-icon="inline-start" />}
        />
        <MetricCard
          title="Cliques em produto"
          value={analytics.event_counts.product_card_click}
          description={`${analytics.unique_event_visitors.product_card_click} visitantes unicos.`}
          icon={<MousePointerClick data-icon="inline-start" />}
        />
        <MetricCard
          title="Paginas de produto"
          value={analytics.event_counts.product_view}
          description={`${analytics.unique_event_visitors.product_view} visitantes unicos.`}
          icon={<BarChart3 data-icon="inline-start" />}
        />
        <MetricCard
          title="WhatsApp"
          value={analytics.event_counts.whatsapp_click}
          description={`${analytics.unique_event_visitors.whatsapp_click} visitantes unicos.`}
          icon={<Send data-icon="inline-start" />}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader>
            <CardTitle>Produtos que geram interesse</CardTitle>
            <CardDescription>
              Conversao = visitantes unicos que clicaram no card e tambem clicaram no WhatsApp.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.top_products.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Card</TableHead>
                    <TableHead>Pagina</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Conversao</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.top_products.map((product) => (
                    <TableRow key={product.key}>
                      <TableCell>
                        <div className="font-medium">{formatProductName(product.product_name)}</div>
                        <div className="text-xs text-muted-foreground">
                          {product.unique_visitors} visitante
                          {product.unique_visitors === 1 ? "" : "s"} unico
                          {product.unique_visitors === 1 ? "" : "s"}
                        </div>
                      </TableCell>
                      <TableCell>{product.card_clicks}</TableCell>
                      <TableCell>{product.product_views}</TableCell>
                      <TableCell>{product.whatsapp_clicks}</TableCell>
                      <TableCell>
                        <Badge variant={product.conversion_rate > 0 ? "default" : "secondary"}>
                          {product.conversion_rate}%
                        </Badge>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {product.card_to_whatsapp_visitors} visitante
                          {product.card_to_whatsapp_visitors === 1 ? "" : "s"}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                Ainda nao ha eventos de produto no periodo.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ultimos eventos</CardTitle>
            <CardDescription>Leitura rapida do que aconteceu mais recentemente.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {analytics.recent_events.map((event) => (
              <div key={event.id} className="rounded-md border p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">{analyticsEventLabels[event.event_type]}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(event.created_at)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {event.product_name
                    ? formatProductName(event.product_name)
                    : event.path ?? "Sem pagina registrada"}
                </p>
              </div>
            ))}
            {analytics.recent_events.length === 0 ? (
              <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                Nenhum evento registrado ainda.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  await requireAdmin();
  const resolvedSearchParams = (await searchParams) ?? {};
  const days = getPeriod(resolvedSearchParams.days);
  let analytics: AdminAnalyticsSummary | null = null;
  let setupError = "";

  try {
    analytics = await getAdminAnalytics(days);
  } catch (error) {
    setupError = error instanceof Error ? error.message : "Erro ao carregar analytics.";
  }

  return (
    <AdminShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Visitantes anonimos, cliques em produtos e intencao de contato no WhatsApp.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {periodOptions.map((period) => (
            <Button
              key={period}
              asChild
              variant={period === days ? "default" : "outline"}
              size="sm"
            >
              <Link href={`/admin/analytics?days=${period}`}>{period} dias</Link>
            </Button>
          ))}
        </div>
      </div>

      {setupError ? <SetupNotice message={setupError} /> : null}
      {analytics ? <AnalyticsContent analytics={analytics} /> : null}
    </AdminShell>
  );
}
