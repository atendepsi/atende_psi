import * as React from "react";
import { AtendePsiShell } from "@/components/atendepsi-shell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Plus, Search, BookOpen } from "lucide-react";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

type Memory = {
  id: number;
  pergunta: string;
  resposta: string;
  keyword: string | null;
  user_id: string;
};

export default function MemoryPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [memories, setMemories] = React.useState<Memory[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [open, setOpen] = React.useState(false);
  const [currentMemory, setCurrentMemory] = React.useState<Memory | null>(null);
  const [deleteId, setDeleteId] = React.useState<number | null>(null);

  // Form states
  const [question, setQuestion] = React.useState("");
  const [answer, setAnswer] = React.useState("");
  const [searchTerm, setSearchTerm] = React.useState("");

  React.useEffect(() => {
    fetchMemories();
  }, [user]);

  const fetchMemories = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('memory')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      if (data) setMemories(data);
    } catch (error) {
      console.error("Error fetching memories:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMemories = memories.filter(
    (m) =>
      (m.pergunta?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (m.resposta?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  const handleOpen = (memory?: Memory) => {
    if (memory) {
      setCurrentMemory(memory);
      setQuestion(memory.pergunta);
      setAnswer(memory.resposta);
    } else {
      setCurrentMemory(null);
      setQuestion("");
      setAnswer("");
    }
    setOpen(true);
  };

  const handleSave = async () => {
    if (!question || !answer || !user) return;

    try {
      if (currentMemory) {
        // Edit
        const { error } = await supabase
          .from('memory')
          .update({ pergunta: question, resposta: answer })
          .eq('id', currentMemory.id)
          .eq('user_id', user.id); // Extra safety

        if (error) throw error;
        toast({ title: "Memória atualizada!", className: "bg-green-500 text-white" });
      } else {
        // Create
        const { error } = await supabase
          .from('memory')
          .insert([{
            pergunta: question,
            resposta: answer,
            user_id: user.id
          }]);

        if (error) throw error;
        toast({ title: "Memória criada!", className: "bg-green-500 text-white" });
      }

      fetchMemories(); // Refresh list
      setOpen(false);
    } catch (error) {
      console.error("Error saving memory:", error);
      toast({ title: "Erro ao salvar memória.", variant: "destructive" });
    }
  };

  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (deleteId && user) {
      try {
        const { error } = await supabase
          .from('memory')
          .delete()
          .eq('id', deleteId)
          .eq('user_id', user.id);

        if (error) throw error;

        setMemories(memories.filter((m) => m.id !== deleteId));
        toast({ title: "Memória removida." });
      } catch (error) {
        console.error("Error deleting memory:", error);
        toast({ title: "Erro ao remover memória.", variant: "destructive" });
      }
      setDeleteId(null);
    }
  };

  if (loading) {
    return (
      <AtendePsiShell title="Memória da IA">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AtendePsiShell>
    )
  }

  return (
    <AtendePsiShell
      title="Memória da IA"
      right={
        <div />
      }
    >
      <div className="flex flex-col gap-6 h-full overflow-hidden pb-1">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div className="flex flex-col gap-1 w-full max-w-3xl">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="how-it-works" className="border-0">
                <AccordionTrigger className="w-full flex items-center gap-2 p-4 rounded-xl bg-[#006f9a]/10 hover:bg-[#006f9a]/20 text-[#006f9a] font-medium text-sm transition-all hover:no-underline [&[data-state=open]]:rounded-b-none">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Como funciona?
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed space-y-4 pt-4">
                  <p>
                    Nesta aba, você cadastra perguntas e respostas estratégicas que servirão de base para todo o conhecimento da ferramenta. Imagine que a IA é uma secretária ou assistente clínica que acaba de ser contratada; a Aba de Memórias é onde você ensina a ela tudo o que ela precisa saber para representar o seu consultório com precisão.
                  </p>

                  <div className="space-y-2">
                    <strong className="text-foreground block font-semibold">O que incluir nessa base de conhecimento?</strong>
                    <p>Para que a IA seja realmente útil, você pode alimentar essa aba com:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Informações do Negócio:</strong> Horários de atendimento, localização, valores de sessão e convênios aceitos.</li>
                      <li><strong>Abordagem Terapêutica:</strong> Explicações sobre como você trabalha (ex: TCC, Psicanálise, Fenomenologia) para que a IA saiba explicar seu método aos pacientes.</li>
                      <li><strong>Políticas de Cancelamento:</strong> Regras sobre faltas e reagendamentos.</li>
                      <li><strong>Dúvidas Frequentes (FAQ):</strong> Respostas prontas para perguntas comuns que os pacientes costumam fazer antes da primeira sessão.</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <strong className="text-foreground block font-semibold">Por que isso é importante?</strong>
                    <p>
                      Diferente de um chat comum, uma IA com "memória" não inventa informações. Ela consulta essa base de dados antes de responder, garantindo que o atendimento seja personalizado, ético e totalmente alinhado à identidade do seu serviço.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between shrink-0">
          <div className="relative flex-1 w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar memórias..."
              className="pl-9 bg-white border-border/60 shadow-sm focus:bg-white transition-all h-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => handleOpen()} className="gap-2 rounded-full font-medium shadow-md hover:shadow-lg transition-all bg-[#006f9a] hover:bg-[#005a7d] text-white">
            <Plus className="h-4 w-4" />
            Adicionar memória
          </Button>
        </div>

        <div className="space-y-4 overflow-y-auto flex-1 min-h-0 pr-2">
          {filteredMemories.map((m) => (
            <div key={m.id} className="ap-card ap-noise rounded-2xl p-6 group relative transition-all hover:shadow-md" data-testid={`card-memory-${m.id}`}>
              <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-muted"
                  onClick={() => handleOpen(m)}
                >
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => handleDeleteClick(m.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div
                className="text-base font-semibold tracking-tight text-[#006f9a] pr-12"
                data-testid={`text-memory-q-${m.id}`}
              >
                {m.pergunta}
              </div>
              <div className="mt-2 text-sm leading-relaxed text-foreground/80" data-testid={`text-memory-a-${m.id}`}>
                {m.resposta}
              </div>

            </div>
          ))}
          {filteredMemories.length === 0 && (
            <div className="text-center text-muted-foreground py-10 opacity-60">
              Nenhuma memória encontrada.
            </div>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="ap-card rounded-2xl border-border/70 sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {currentMemory ? "Editar memória" : "Nova memória"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pergunta ou Tópico</Label>
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ex: Qual o valor da consulta?"
                className="bg-muted/30 border-border/60 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resposta da IA</Label>
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Ex: O valor é R$ 250,00..."
                className="min-h-[120px] bg-muted/30 border-border/60 rounded-xl resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              className="rounded-full"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className="rounded-full px-6"
              onClick={handleSave}
              disabled={!question || !answer}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="ap-card rounded-2xl border-border/70">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover memória?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A IA deixará de usar esta informação nas respostas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AtendePsiShell>
  );
}
