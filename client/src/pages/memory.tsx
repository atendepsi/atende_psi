import * as React from "react";
import { AtendePsiShell } from "@/components/atendepsi-shell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Pencil } from "lucide-react";

type Memory = {
  id: string;
  q: string;
  a: string;
};

const initial: Memory[] = [
  {
    id: "1",
    q: "Qual \u00e9 meu hor\u00e1rio de atendimento?",
    a: "Atendo de quarta a sexta, das 9h \u00e0s 18h. Evito encaixes no mesmo dia.",
  },
  {
    id: "2",
    q: "Como devo responder quando perguntam sobre valores?",
    a: "Responder com cuidado e clareza, explicar que os valores variam conforme modalidade e oferecer enviar detalhes ap\u00f3s entender a demanda.",
  },
  {
    id: "3",
    q: "Qual \u00e9 minha prefer\u00eancia de linguagem?",
    a: "Tom acolhedor, objetivo e respeitoso; sem jarg\u00f5es e sem promessas terap\u00eauticas.",
  },
];

export default function MemoryPage() {
  const [open, setOpen] = React.useState(false);

  return (
    <AtendePsiShell
      title="Mem\u00f3ria da IA"
      right={
        <Button
          variant="secondary"
          className="rounded-full"
          onClick={() => setOpen(true)}
          data-testid="button-editar-memorias"
        >
          <Pencil className="h-4 w-4" />
          Editar mem\u00f3rias
        </Button>
      }
    >
      <div className="space-y-4">
        {initial.map((m) => (
          <div key={m.id} className="ap-card ap-noise rounded-2xl p-5" data-testid={`card-memory-${m.id}`}>
            <div
              className="text-sm font-semibold tracking-[-0.01em]"
              style={{ fontFamily: "DM Sans, var(--font-sans)" }}
              data-testid={`text-memory-q-${m.id}`}
            >
              {m.q}
            </div>
            <div className="mt-2 text-sm text-foreground/90" data-testid={`text-memory-a-${m.id}`}>
              {m.a}
            </div>
            <div className="mt-3 text-xs text-muted-foreground" data-testid={`text-memory-helper-${m.id}`}>
              Isso ajuda a IA a responder pacientes do seu jeito.
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="ap-card rounded-2xl border-border/70">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "DM Sans, var(--font-sans)" }}>
              Editar mem\u00f3rias
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="text-sm text-muted-foreground" data-testid="text-memory-modal-hint">
              Ajuste as respostas para refinar o comportamento da IA.
            </div>
            <Textarea
              defaultValue={initial
                .map((m) => `Pergunta: ${m.q}\nResposta: ${m.a}`)
                .join("\n\n")}
              className="min-h-[220px] rounded-2xl"
              data-testid="textarea-memorias"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                className="rounded-full"
                onClick={() => setOpen(false)}
                data-testid="button-cancelar-memorias"
              >
                Cancelar
              </Button>
              <Button
                className="rounded-full"
                onClick={() => setOpen(false)}
                data-testid="button-salvar-memorias"
              >
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AtendePsiShell>
  );
}
