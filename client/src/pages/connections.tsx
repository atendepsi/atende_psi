import { AtendePsiShell } from "@/components/atendepsi-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MessageCircle } from "lucide-react";

type Conn = {
  id: string;
  name: string;
  status: "connected" | "disconnected";
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

const items: Conn[] = [
  {
    id: "whatsapp",
    name: "WhatsApp",
    status: "connected",
    description: "Mensagens e atendimento com IA.",
    icon: MessageCircle,
  },
  {
    id: "google-calendar",
    name: "Google Agenda",
    status: "disconnected",
    description: "Sincroniza\u00e7\u00e3o de hor\u00e1rios e confirma\u00e7\u00f5es.",
    icon: Calendar,
  },
];

export default function ConnectionsPage() {
  return (
    <AtendePsiShell title="Conex\u00f5es">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {items.map((it) => {
          const Icon = it.icon;
          const connected = it.status === "connected";

          return (
            <div key={it.id} className="ap-card ap-noise rounded-2xl p-5" data-testid={`card-connection-${it.id}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-muted/60 border border-border flex items-center justify-center">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div
                      className="text-sm font-semibold tracking-[-0.01em]"
                      style={{ fontFamily: "DM Sans, var(--font-sans)" }}
                      data-testid={`text-connection-name-${it.id}`}
                    >
                      {it.name}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground" data-testid={`text-connection-desc-${it.id}`}>
                      {it.description}
                    </div>
                  </div>
                </div>

                <Badge
                  className="rounded-full"
                  variant={connected ? "default" : "secondary"}
                  data-testid={`status-connection-${it.id}`}
                >
                  {connected ? "Conectado" : "N\u00e3o conectado"}
                </Badge>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2">
                <Button
                  variant={connected ? "secondary" : "default"}
                  className="rounded-full"
                  data-testid={`button-connection-${connected ? "reconnect" : "connect"}-${it.id}`}
                >
                  {connected ? "Reconectar" : "Conectar"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </AtendePsiShell>
  );
}
