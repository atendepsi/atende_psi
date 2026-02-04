
import * as React from "react";
import { AtendePsiShell } from "@/components/atendepsi-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function SettingsPage() {
  const { toast } = useToast();
  const { signOut } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [userId, setUserId] = React.useState<string | null>(null);

  const [tone, setTone] = React.useState("Objetiva");
  const [agentName, setAgentName] = React.useState("Sofia");

  const [restrictions, setRestrictions] = React.useState<string[]>([]); // Initialize empty
  const [newRestriction, setNewRestriction] = React.useState("");

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setUserId(user.id);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error);
        }

        if (data) {
          setAgentName(data.ai_name || "Sofia");
          setTone(data.ai_tone || "Objetiva");
          setRestrictions(data.ai_restrictions || []);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchProfile();
  }, []);

  const addRestriction = () => {
    if (newRestriction.trim()) {
      setRestrictions([...restrictions, newRestriction.trim()]);
      setNewRestriction("");
    }
  };

  const removeRestriction = (index: number) => {
    setRestrictions(restrictions.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!userId) return;

    try {
      const updates = {
        id: userId,
        ai_name: agentName,
        ai_tone: tone,
        ai_restrictions: restrictions,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);

      if (error) throw error;
      toast({
        title: "Sucesso",
        description: "Configurações salvas com sucesso!",
        className: "bg-green-600 text-white border-none"
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <AtendePsiShell title="Configurações">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AtendePsiShell>
    )
  }

  return (
    <AtendePsiShell title="Configurações">
      <div className="h-full overflow-y-auto flex-1 min-h-0 pb-1 pr-2">
        <div className="flex flex-col gap-3">

          {/* Profile Section - Compact */}
          <div className="ap-card rounded-2xl p-5 bg-card/50 border border-border/60 shadow-sm">
            <h2 className="text-lg font-semibold tracking-tight mb-3">Perfil do Agente</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Nome do Agente</Label>
                <Input
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="h-10 rounded-xl bg-muted/40 border-border/60 text-base"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Tom de Comunicação</Label>
                <div className="grid grid-cols-3 gap-2">
                  {["Formal", "Objetiva", "Descontraída"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTone(t)}
                      className={cn(
                        "px-2 py-2 rounded-lg text-xs font-medium transition-all border",
                        tone === t
                          ? "bg-[#006f9a] text-white border-[#006f9a] shadow-sm"
                          : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/60"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Restrictions Section - Compact */}
          <div className="ap-card rounded-2xl p-5 bg-card/50 border border-border/60 shadow-sm">
            <h2 className="text-lg font-semibold tracking-tight mb-3">Restrições Operacionais</h2>

            <div className="space-y-2">
              {restrictions.map((r, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/40 hover:border-border transition-colors">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="h-1.5 w-1.5 rounded-full bg-destructive/60 shrink-0" />
                    <span className="text-xs font-medium truncate">{r}</span>
                  </div>
                  <button onClick={() => removeRestriction(i)} className="text-muted-foreground hover:text-destructive transition-colors px-1">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              <Input
                placeholder="Adicionar restrição..."
                value={newRestriction}
                onChange={(e) => setNewRestriction(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addRestriction()}
                className="h-9 rounded-lg bg-background border-border/60 text-sm"
              />
              <Button onClick={addRestriction} size="icon" className="h-9 w-9 rounded-lg shrink-0 bg-muted hover:bg-muted/80 text-foreground">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex justify-between items-center pt-8 border-t border-border/50">
            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
              onClick={() => signOut()}
            >
              <LogOut className="h-4 w-4" />
              Sair da conta
            </Button>

            <Button onClick={handleSave} className="rounded-full h-11 px-8 text-sm shadow-lg shadow-[#006f9a]/20 bg-[#006f9a] hover:bg-[#005a7d] text-white font-medium">
              Salvar Alterações
            </Button>
          </div>

        </div>
      </div>
    </AtendePsiShell>
  );
}
