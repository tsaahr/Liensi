/* eslint-disable @next/next/no-img-element */
import { ImagePlus, Save, Trash2 } from "lucide-react";

import { AdminNotice } from "@/components/admin/admin-notice";
import { AdminShell } from "@/components/admin/admin-shell";
import { SubmitButton } from "@/components/admin/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createBanner, deleteBanner, updateBanner } from "@/lib/admin-actions";
import { getAdminBanners } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

type BannersAdminPageProps = {
  searchParams?: Promise<{
    success?: string;
    error?: string;
  }>;
};

export default async function BannersAdminPage({ searchParams }: BannersAdminPageProps) {
  await requireAdmin();
  const resolvedSearchParams = (await searchParams) ?? {};
  const banners = await getAdminBanners();

  return (
    <AdminShell>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Banners</h1>
        <p className="text-sm text-muted-foreground">
          Controle os destaques exibidos no topo do cat&aacute;logo.
        </p>
      </div>

      <AdminNotice success={resolvedSearchParams.success} error={resolvedSearchParams.error} />

      <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Novo banner</CardTitle>
            <CardDescription>
              Envie uma imagem desktop, uma mobile opcional e defina o texto exibido sobre ela.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createBanner} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="new-desktop-image">Imagem desktop</Label>
                <Input
                  id="new-desktop-image"
                  name="desktop_image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  JPG, PNG ou WebP ate 10 MB. O upload vira WebP automaticamente.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="new-mobile-image">Imagem mobile opcional</Label>
                <Input
                  id="new-mobile-image"
                  name="mobile_image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="new-eyebrow">Chamada curta</Label>
                <Input id="new-eyebrow" name="eyebrow" placeholder="Ex: Nova selecao" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="new-title">Titulo</Label>
                <Input id="new-title" name="title" placeholder="Texto principal" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="new-subtitle">Texto</Label>
                <Textarea id="new-subtitle" name="subtitle" rows={3} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="new-button-label">Botao</Label>
                  <Input id="new-button-label" name="button_label" placeholder="Ver produtos" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="new-href">Link</Label>
                  <Input id="new-href" name="href" placeholder="/#catalogo" />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="new-alt">Texto alternativo</Label>
                  <Input id="new-alt" name="alt_text" placeholder="Descricao da imagem" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="new-order">Ordem</Label>
                  <Input id="new-order" name="display_order" type="number" min={0} defaultValue={0} />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="new-focal-x">Foco horizontal (%)</Label>
                  <Input
                    id="new-focal-x"
                    name="focal_point_x"
                    type="number"
                    min={0}
                    max={100}
                    defaultValue={50}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="new-focal-y">Foco vertical (%)</Label>
                  <Input
                    id="new-focal-y"
                    name="focal_point_y"
                    type="number"
                    min={0}
                    max={100}
                    defaultValue={50}
                  />
                </div>
              </div>
              <label className="flex h-9 items-center gap-2 rounded-md border px-3 text-sm">
                <input type="checkbox" name="active" defaultChecked className="size-4" />
                Banner ativo
              </label>
              <SubmitButton type="submit" pendingLabel="Criando...">
                <ImagePlus data-icon="inline-start" />
                Criar banner
              </SubmitButton>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Banners cadastrados</CardTitle>
            <CardDescription>
              {banners.length
                ? `${banners.length} banner${banners.length === 1 ? "" : "s"} no carrossel.`
                : "Nenhum banner cadastrado. A area de banner nao aparece no catalogo."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {banners.map((banner) => (
              <div key={banner.id} className="rounded-lg border bg-background p-4">
                <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
                  <div className="grid gap-3">
                    <div className="overflow-hidden rounded-md border bg-muted">
                      <img
                        src={banner.url}
                        alt={(banner.alt_text ?? banner.title) || "Banner do catalogo"}
                        className="aspect-[16/9] h-full w-full object-cover"
                        style={{
                          objectPosition: `${banner.focal_point_x}% ${banner.focal_point_y}%`
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-3">
                      <div className="overflow-hidden rounded-md border bg-muted">
                        {banner.mobile_url ? (
                          <img
                            src={banner.mobile_url}
                            alt={(banner.alt_text ?? banner.title) || "Banner mobile"}
                            className="aspect-[9/16] h-full w-full object-cover"
                            style={{
                              objectPosition: `${banner.focal_point_x}% ${banner.focal_point_y}%`
                            }}
                          />
                        ) : (
                          <div className="flex aspect-[9/16] items-center justify-center px-2 text-center text-[10px] text-muted-foreground">
                            Sem imagem mobile
                          </div>
                        )}
                      </div>
                      <div className="self-center break-all text-xs text-muted-foreground">
                        <p>Desktop: {banner.storage_path}</p>
                        <p>Mobile: {banner.mobile_storage_path ?? "usa a imagem desktop"}</p>
                        <p>
                          Foco: {banner.focal_point_x}% / {banner.focal_point_y}%
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-4">
                    <form
                      action={updateBanner.bind(null, banner.id)}
                      className="grid gap-4 md:grid-cols-2"
                    >
                      <div className="flex flex-col gap-2">
                        <Label htmlFor={`desktop-image-${banner.id}`}>Trocar desktop</Label>
                        <Input
                          id={`desktop-image-${banner.id}`}
                          name="desktop_image"
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor={`mobile-image-${banner.id}`}>Trocar mobile</Label>
                        <Input
                          id={`mobile-image-${banner.id}`}
                          name="mobile_image"
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor={`order-${banner.id}`}>Ordem</Label>
                        <Input
                          id={`order-${banner.id}`}
                          name="display_order"
                          type="number"
                          min={0}
                          defaultValue={banner.display_order}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor={`eyebrow-${banner.id}`}>Chamada curta</Label>
                        <Input
                          id={`eyebrow-${banner.id}`}
                          name="eyebrow"
                          defaultValue={banner.eyebrow ?? ""}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor={`title-${banner.id}`}>Titulo</Label>
                        <Input id={`title-${banner.id}`} name="title" defaultValue={banner.title} />
                      </div>
                      <div className="flex flex-col gap-2 md:col-span-2">
                        <Label htmlFor={`subtitle-${banner.id}`}>Texto</Label>
                        <Textarea
                          id={`subtitle-${banner.id}`}
                          name="subtitle"
                          rows={3}
                          defaultValue={banner.subtitle ?? ""}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor={`button-${banner.id}`}>Botao</Label>
                        <Input
                          id={`button-${banner.id}`}
                          name="button_label"
                          defaultValue={banner.button_label ?? ""}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor={`href-${banner.id}`}>Link</Label>
                        <Input id={`href-${banner.id}`} name="href" defaultValue={banner.href ?? ""} />
                      </div>
                      <div className="flex flex-col gap-2 md:col-span-2">
                        <Label htmlFor={`alt-${banner.id}`}>Texto alternativo</Label>
                        <Input
                          id={`alt-${banner.id}`}
                          name="alt_text"
                          defaultValue={banner.alt_text ?? ""}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor={`focal-x-${banner.id}`}>Foco horizontal (%)</Label>
                        <Input
                          id={`focal-x-${banner.id}`}
                          name="focal_point_x"
                          type="number"
                          min={0}
                          max={100}
                          defaultValue={banner.focal_point_x}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor={`focal-y-${banner.id}`}>Foco vertical (%)</Label>
                        <Input
                          id={`focal-y-${banner.id}`}
                          name="focal_point_y"
                          type="number"
                          min={0}
                          max={100}
                          defaultValue={banner.focal_point_y}
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-3 md:col-span-2">
                        <label className="flex h-9 items-center gap-2 rounded-md border px-3 text-sm">
                          <input
                            type="checkbox"
                            name="active"
                            defaultChecked={banner.active}
                            className="size-4"
                          />
                          Banner ativo
                        </label>
                        <SubmitButton type="submit" variant="outline" pendingLabel="Salvando...">
                          <Save data-icon="inline-start" />
                          Salvar
                        </SubmitButton>
                      </div>
                    </form>
                    <form action={deleteBanner.bind(null, banner.id)}>
                      <SubmitButton
                        type="submit"
                        variant="destructive"
                        pendingLabel="Excluindo..."
                        confirmMessage={`Excluir o banner "${banner.title || banner.storage_path}"?`}
                      >
                        <Trash2 data-icon="inline-start" />
                        Excluir banner
                      </SubmitButton>
                    </form>
                  </div>
                </div>
              </div>
            ))}

            {banners.length === 0 ? (
              <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                Crie um banner para exibir um destaque no topo do catalogo.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
