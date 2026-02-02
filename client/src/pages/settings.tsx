import * as React from "react";
import { AtendePsiShell } from "@/components/atendepsi-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export default function SettingsPage() {
  const [aiOn, setAiOn] = React.useState(true);
  const [tone, setTone] = React.useState("Objetiva");

  return (
    <AtendePsiShell title="Configura\u00e7\u00f5es">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="ap-card ap-noise rounded-2xl p-5">
          <div
            className="text-sm font-semibold tracking-[-0.01em]"
            style={{ fontFamily: "DM Sans, var(--font-sans)" }}
            data-testid="text-settings-ai-profile"
          >
            Perfil da IA
          </div>

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="agentName" data-testid="label-agent-name">Nome do agente</Label>
              <Input id="agentName" defaultValue="AtendePsi" className="rounded-2xl" data-testid="input-agent-name" />
            </div>

            <div className="space-y-2">
              <Label data-testid="label-agent-tone">Comunica\u00e7\u00e3o</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="rounded-2xl" data-testid="select-agent-tone">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Formal" data-testid="option-tone-formal">Formal</SelectItem>
                  <SelectItem value="Objetiva" data-testid="option-tone-objetiva">Objetiva</SelectItem>
                  <SelectItem value="Descontra\u00edda" data-testid="option-tone-descontraida">Descontra\u00edda</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label data-testid="label-restrictions">Restri\u00e7\u00f5es</Label>
              <Textarea
                defaultValue={[
                  "N\u00e3o atende segundas e ter\u00e7as.",
                  "N\u00e3o responde fora do hor\u00e1rio comercial.",
                  "N\u00e3o agenda determinados procedimentos.",
                ].join("\n")}
                className="min-h-[160px] rounded-2xl"
                data-testid="textarea-restrictions"
              />
              <div className="text-xs text-muted-foreground" data-testid="text-restrictions-hint">
                Regras operacionais que a IA n\u00e3o pode violar.
              </div>
            </div>

            <div className="flex justify-end">
              <Button className="rounded-full" data-testid="button-save-settings">
                Salvar altera\u00e7\u00f5es
              </Button>
            </div>
          </div>
        </div>

        <div className="ap-card ap-noise rounded-2xl p-5">
          <div
            className="text-sm font-semibold tracking-[-0.01em]"
            style={{ fontFamily: "DM Sans, var(--font-sans)" }}
            data-testid="text-settings-status"
          >
            Status da IA e Conex\u00f5es
          </div>

          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
              <div>
                <div className="text-sm font-medium" data-testid="text-toggle-ai-title">IA</div>
                <div className="text-xs text-muted-foreground" data-testid="text-toggle-ai-sub">Ligar / desligar assistente</div>
              </div>
              <Switch checked={aiOn} onCheckedChange={setAiOn} data-testid="toggle-ai-settings" />
            </div>

            <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium" data-testid="text-status-whatsapp">WhatsApp</div>
                  <div className="text-xs text-muted-foreground" data-testid="text-status-whatsapp-sub">Conectado</div>
                </div>
                <Button variant="secondary" className="rounded-full" data-testid="button-disconnect-whatsapp">
                  Desconectar
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium" data-testid="text-status-calendar">Google Agenda</div>
                  <div className="text-xs text-muted-foreground" data-testid="text-status-calendar-sub">N\u00e3o conectado</div>
                </div>
                <Button className="rounded-full" data-testid="button-connect-calendar">Conectar</Button>
              </div>
            </div>

            <div className="text-xs text-muted-foreground" data-testid="text-status-hint">
              Tudo expl\u00edcito. Sem ambiguidade.
            </div>
          </div>
        </div>
      </div>
    </AtendePsiShell>
  );
}
