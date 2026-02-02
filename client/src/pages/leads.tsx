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
import { MessageCircle } from "lucide-react";

type Lead = {
  id: string;
  name: string;
  phone: string;
  last: string;
  modality: "Online" | "Presencial" | "Misto";
  email: string;
  channel: string;
};

const leads: Lead[] = [
  {
    id: "1",
    name: "Mariana Souza",
    phone: "+55 11 99821-4450",
    last: "há 12 min",
    modality: "Online",
    email: "mariana.souza@email.com",
    channel: "Indicação",
  },
  {
    id: "2",
    name: "Rafael Almeida",
    phone: "+55 21 99102-1108",
    last: "há 1h",
    modality: "Misto",
    email: "rafa.almeida@email.com",
    channel: "Google",
  },
  {
    id: "3",
    name: "Camila Ribeiro",
    phone: "+55 31 98800-2211",
    last: "ontem",
    modality: "Presencial",
    email: "camila.ribeiro@email.com",
    channel: "Instagram",
  },
  {
    id: "4",
    name: "Diego Pereira",
    phone: "+55 41 99755-9921",
    last: "há 3 dias",
    modality: "Online",
    email: "diego.p@email.com",
    channel: "Site",
  },
];

export default function LeadsPage() {
  return (
    <AtendePsiShell title="Leads">
      <div className="ap-card ap-noise rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border/70">
          <div
            className="text-sm font-semibold tracking-[-0.01em]"
            style={{ fontFamily: "DM Sans, var(--font-sans)" }}
            data-testid="text-leads-title"
          >
            Contatos
          </div>
          <div className="mt-1 text-xs text-muted-foreground" data-testid="text-leads-subtitle">
            Ordenado pela \u00faltima intera\u00e7\u00e3o.
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="pl-5">Nome</TableHead>
              <TableHead>N\u00famero</TableHead>
              <TableHead>\u00daltima intera\u00e7\u00e3o</TableHead>
              <TableHead>Modalidade</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Canal</TableHead>
              <TableHead className="pr-5 text-right">A\u00e7\u00f5es</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id} data-testid={`row-lead-${lead.id}`}>
                <TableCell className="pl-5">
                  <div className="font-medium" data-testid={`text-lead-name-${lead.id}`}>
                    {lead.name}
                  </div>
                </TableCell>
                <TableCell data-testid={`text-lead-phone-${lead.id}`}>{lead.phone}</TableCell>
                <TableCell data-testid={`text-lead-last-${lead.id}`}>{lead.last}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className="rounded-full"
                    data-testid={`badge-lead-modality-${lead.id}`}
                  >
                    {lead.modality}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground" data-testid={`text-lead-email-${lead.id}`}>
                  {lead.email}
                </TableCell>
                <TableCell className="text-muted-foreground" data-testid={`text-lead-channel-${lead.id}`}>
                  {lead.channel}
                </TableCell>
                <TableCell className="pr-5 text-right">
                  <Button
                    variant="secondary"
                    className="rounded-full"
                    data-testid={`button-contato-whatsapp-${lead.id}`}
                  >
                    <MessageCircle className="h-4 w-4" />
                    Contato
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AtendePsiShell>
  );
}
