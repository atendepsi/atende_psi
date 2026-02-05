import { useState, useEffect } from "react";
import { AtendePsiShell } from "@/components/atendepsi-shell";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";

type Lead = {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  status: string;
  frequency: string;
  week_day: string;
  time: string;
  age: string;
  billing_day: string;
  channel: string;
  last_contact: string;
};

export default function LeadsPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");

  useEffect(() => {
    const fetchLeads = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .eq('user_id', user.id)
        //.order('last_message_at', { ascending: false }); // Optional: sort by recent

        if (error) throw error;

        if (data) {
          const mappedLeads: Lead[] = data.map((item: any) => ({
            id: item.id,
            name: item.full_name || item.nome || "Sem Nome",
            phone: item.phone_number?.toString() || "",
            email: item.email || "",
            status: item.status || "Novo",
            frequency: item.frequencia?.toString() || "-",
            week_day: item.week_day || "-",
            time: item.horario || "-",
            age: item.idade || "-",
            billing_day: item.billing_day || "-",
            channel: item.canal || "-",
            last_contact: formatTimeSince(item.last_message_at)
          }));
          setLeads(mappedLeads);
        }
      } catch (error) {
        console.error("Error fetching leads:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, [user]);

  // Helper to format rough "time since"
  const formatTimeSince = (dateString?: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 60000); // minutes

    if (diff < 60) return `há ${diff} min`;
    if (diff < 1440) return `há ${Math.floor(diff / 60)}h`;
    return `há ${Math.floor(diff / 1440)} dias`;
  };

  const mapStatus = (item: any) => {
    // Logic to determine status if not a direct column.
    // For now returning "Novo" or "Em Conversa" randomly or based on fields
    if (item.followup) return "Em Conversa";
    return "Novo";
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm);
    const matchesStatus =
      statusFilter === "todos" || lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Novo":
        return "bg-blue-100 text-blue-700 hover:bg-blue-100";
      case "Em Conversa":
        return "bg-amber-100 text-amber-700 hover:bg-amber-100";
      case "Agendado":
        return "bg-emerald-100 text-emerald-700 hover:bg-emerald-100";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const updateLead = async (id: number, field: string, value: string) => {
    try {
      // Map frontend field names to DB column names if they differ
      const dbFieldMap: Record<string, string> = {
        frequency: 'frequencia',
        week_day: 'week_day',
        time: 'horario',
        billing_day: 'billing_day'
      };

      const dbField = dbFieldMap[field] || field;

      const { error } = await supabase
        .from('leads')
        .update({ [dbField]: value })
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Optimistic update locally
      setLeads(leads.map(l => l.id === id ? { ...l, [field]: value } : l));

    } catch (error) {
      console.error("Error updating lead:", error);
      // Revert or show error toast here if needed
    }
  };

  if (loading) {
    return (
      <AtendePsiShell title="Contatos">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AtendePsiShell>
    )
  }

  return (
    <AtendePsiShell title="Contatos">
      <div className="flex flex-col gap-6 h-full overflow-hidden pb-1">
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, telefone..."
              className="pl-9 bg-white border-border/60 shadow-sm focus:bg-white transition-all h-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] h-10 bg-white border-border/60 shadow-sm">
                <div className="flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder="Status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="Novo">Novo</SelectItem>
                <SelectItem value="Em Conversa">Em Conversa</SelectItem>
                <SelectItem value="Agendado">Agendado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Content - Table Card */}
        <div className="ap-card ap-noise rounded-2xl flex flex-col flex-1 min-h-0 overflow-hidden border border-border/60 shadow-sm bg-white">
          <div className="px-6 py-4 border-b border-border/50 shrink-0 flex items-center justify-between bg-muted/5">
            <div>
              <div className="text-sm font-semibold text-foreground tracking-tight">
                Todos os contatos
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Gerencie seus leads e pacientes.
              </div>
            </div>
            <div className="text-xs font-medium text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-md border border-border/50">
              Total: {filteredLeads.length}
            </div>
          </div>

          <div className="overflow-auto flex-1 min-h-0">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10 shadow-sm/5">
                <TableRow className="hover:bg-transparent border-b border-border/50">
                  <TableHead className="pl-6 h-10 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nome</TableHead>
                  <TableHead className="h-10 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Número</TableHead>
                  <TableHead className="h-10 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</TableHead>
                  <TableHead className="h-10 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</TableHead>
                  <TableHead className="h-10 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Frequência</TableHead>
                  <TableHead className="h-10 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dia</TableHead>
                  <TableHead className="h-10 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Horário</TableHead>
                  <TableHead className="h-10 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Idade</TableHead>
                  <TableHead className="h-10 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dia Cobrança</TableHead>
                  <TableHead className="h-10 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Canal</TableHead>
                  <TableHead className="h-10 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Últ. Contato</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow
                    key={lead.id}
                    className="hover:bg-muted/30 border-b border-border/40 group transition-colors"
                  >
                    <TableCell className="pl-6 py-3">
                      <span className="font-medium text-sm text-foreground">{lead.name}</span>
                    </TableCell>
                    <TableCell className="py-3 text-sm text-muted-foreground font-mono">{lead.phone}</TableCell>
                    <TableCell className="py-3 text-sm text-muted-foreground">{lead.email}</TableCell>
                    <TableCell className="py-3">
                      <Badge className={`rounded-md font-medium border-0 px-2.5 py-0.5 ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 text-sm text-muted-foreground">
                      <Input
                        className="h-8 w-24 bg-transparent border-transparent hover:border-border focus:bg-white focus:border-primary transition-all p-2 text-sm"
                        defaultValue={lead.frequency}
                        onBlur={(e) => updateLead(lead.id, 'frequency', e.target.value)}
                      />
                    </TableCell>
                    <TableCell className="py-3 text-sm text-muted-foreground">
                      <Input
                        className="h-8 w-24 bg-transparent border-transparent hover:border-border focus:bg-white focus:border-primary transition-all p-2 text-sm"
                        defaultValue={lead.week_day}
                        onBlur={(e) => updateLead(lead.id, 'week_day', e.target.value)}
                      />
                    </TableCell>
                    <TableCell className="py-3 text-sm text-muted-foreground">
                      <Input
                        className="h-8 w-20 bg-transparent border-transparent hover:border-border focus:bg-white focus:border-primary transition-all p-2 text-sm"
                        defaultValue={lead.time}
                        onBlur={(e) => updateLead(lead.id, 'time', e.target.value)}
                      />
                    </TableCell>
                    <TableCell className="py-3 text-sm text-muted-foreground">{lead.age}</TableCell>
                    <TableCell className="py-3 text-sm text-muted-foreground">
                      <Input
                        className="h-8 w-16 bg-transparent border-transparent hover:border-border focus:bg-white focus:border-primary transition-all p-2 text-sm"
                        defaultValue={lead.billing_day}
                        onBlur={(e) => updateLead(lead.id, 'billing_day', e.target.value)}
                      />
                    </TableCell>
                    <TableCell className="py-3 text-sm text-muted-foreground">{lead.channel}</TableCell>
                    <TableCell className="py-3 text-sm text-muted-foreground">{lead.last_contact}</TableCell>
                  </TableRow>
                ))}
                {filteredLeads.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={11} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Search className="h-8 w-8 text-muted-foreground/30" />
                        <span>Nenhum contato encontrado</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </AtendePsiShell>
  );
}
