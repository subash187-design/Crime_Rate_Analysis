import { useListIncidents } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function IncidentsPage() {
  const { data: incidents, isLoading } = useListIncidents();

  return (
    <div className="p-8 space-y-6 h-full flex flex-col">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Incidents Explorer</h2>
        <p className="text-muted-foreground mt-1 text-sm">Comprehensive list of logged occurrences.</p>
      </div>

      <div className="flex-1 overflow-auto border border-border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>District</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Occurred</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">Loading...</TableCell>
              </TableRow>
            ) : incidents?.map(incident => (
              <TableRow key={incident.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="font-mono text-xs text-muted-foreground">#{incident.id}</TableCell>
                <TableCell className="font-medium">{incident.crimeType}</TableCell>
                <TableCell>{incident.district}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={`
                    ${incident.severity === 'low' ? 'bg-green-500/10 text-green-500 border-green-500/20' : ''}
                    ${incident.severity === 'medium' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : ''}
                    ${incident.severity === 'high' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : ''}
                    ${incident.severity === 'critical' ? 'bg-red-500/10 text-red-500 border-red-500/20' : ''}
                  `}>
                    {incident.severity}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={`
                    ${incident.status === 'open' ? 'bg-blue-500/10 text-blue-500' : ''}
                    ${incident.status === 'under_investigation' ? 'bg-amber-500/10 text-amber-500' : ''}
                    ${incident.status === 'closed' ? 'bg-gray-500/10 text-gray-500' : ''}
                  `}>
                    {incident.status.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {format(new Date(incident.occurredAt), 'MMM d, yyyy HH:mm')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
