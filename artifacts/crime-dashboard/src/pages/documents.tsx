import { useListDocuments, useDeleteDocument, getListDocumentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { FileText, Trash2, Loader2, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function DocumentsPage() {
  const queryClient = useQueryClient();
  const { data: documents, isLoading } = useListDocuments();
  const deleteDocument = useDeleteDocument();

  const handleDelete = (id: number) => {
    deleteDocument.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
      }
    });
  };

  return (
    <div className="p-8 space-y-6 h-full flex flex-col">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Document Library</h2>
          <p className="text-muted-foreground mt-1 text-sm">Manage ingested crime reports and datasets.</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Upload className="w-4 h-4" />
          Upload Dataset
        </Button>
      </div>

      <Card className="flex-1 min-h-0 flex flex-col bg-card">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Indexed Sources</CardTitle>
          <CardDescription>Files available to the AI Analyst.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-[300px]">Filename</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Chunks</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Loading documents...</TableCell>
                </TableRow>
              ) : documents?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No documents uploaded yet.</TableCell>
                </TableRow>
              ) : documents?.map(doc => (
                <TableRow key={doc.id} className="group hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="truncate max-w-[250px]">{doc.filename}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs uppercase tracking-wider">{doc.fileType}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`
                      ${doc.status === 'indexed' ? 'bg-green-500/10 text-green-500 border-green-500/20' : ''}
                      ${doc.status === 'processing' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : ''}
                      ${doc.status === 'failed' ? 'bg-red-500/10 text-red-500 border-red-500/20' : ''}
                    `}>
                      {doc.status === 'processing' && <Loader2 className="w-3 h-3 mr-1 animate-spin inline-block" />}
                      {doc.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{doc.chunkCount ?? '-'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(doc.createdAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(doc.id)}
                      disabled={deleteDocument.isPending && deleteDocument.variables?.id === doc.id}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
