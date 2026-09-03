import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfessionalRow } from "./professional-row";

interface ProfessionalRowData {
  id: string;
  specialty: string | null;
  license_number: string | null;
  color_hex: string;
  users?: { full_name: string; email: string; active: boolean } | null;
}

export function ProfessionalsSection({ professionals }: { professionals: ProfessionalRowData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profissionais</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {professionals.length === 0 ? (
          <p className="text-[13px] text-foreground-faint">
            Ainda não há profissionais. Convide um utilizador acima com o papel "Profissional" —
            fica aqui automaticamente.
          </p>
        ) : (
          professionals.map((p) => <ProfessionalRow key={p.id} professional={p} />)
        )}
      </CardContent>
    </Card>
  );
}
