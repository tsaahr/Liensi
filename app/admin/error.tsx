"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminError({
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-muted/30 px-4 py-10">
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle>Erro ao carregar o admin</CardTitle>
          <CardDescription>
            Tente novamente. Se continuar, confira se o SQL mais recente foi aplicado no Supabase.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" onClick={reset}>
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
