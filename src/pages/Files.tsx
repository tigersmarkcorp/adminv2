import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Upload, Download, Trash2, FolderOpen, FileText, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function Files() {
  const [files, setFiles] = useState<Tables<"files_metadata">[]>([]);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();

  const fetchFiles = async () => {
    const { data } = await supabase.from("files_metadata").select("*").order("created_at", { ascending: false });
    if (data) setFiles(data);
  };

  useEffect(() => {
    fetchFiles();
    const channel = supabase
      .channel("files-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "files_metadata" }, fetchFiles)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || !user) return;

    setUploading(true);
    for (const file of Array.from(fileList)) {
      const path = `${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("forms-files").upload(path, file);
      if (uploadError) {
        toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
        continue;
      }
      const { error: dbError } = await supabase.from("files_metadata").insert({
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: path,
        uploaded_by: user.id,
      });
      if (dbError) {
        toast({ title: "Error saving metadata", description: dbError.message, variant: "destructive" });
      } else {
        toast({ title: `"${file.name}" uploaded!` });
      }
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleDownload = async (file: Tables<"files_metadata">) => {
    const { data, error } = await supabase.storage.from("forms-files").download(file.storage_path);
    if (error || !data) {
      toast({ title: "Download failed", variant: "destructive" });
      return;
    }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.file_name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (file: Tables<"files_metadata">) => {
    await supabase.storage.from("forms-files").remove([file.storage_path]);
    const { error } = await supabase.from("files_metadata").delete().eq("id", file.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "File deleted" });
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">Forms / Files</h2>
          <p className="text-xs text-muted-foreground">{files.length} files stored</p>
        </motion.div>
        <div>
          <input id="file-upload" type="file" multiple className="hidden" onChange={handleUpload} />
          <Button className="gradient-primary text-white hover:opacity-90 rounded-xl h-10 shadow-md glow-sm-primary" onClick={() => document.getElementById("file-upload")?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
            Upload Files
          </Button>
        </div>
      </div>

      <Card className="border border-border/60 shadow-sm overflow-hidden rounded-2xl">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 border-b border-border/40">
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">File</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Type</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Size</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Uploaded</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((file) => (
                <TableRow key={file.id} className="hover:bg-muted/30 transition-colors border-b border-border/30">
                  <TableCell className="font-medium text-sm flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <span className="truncate max-w-[200px]">{file.file_name}</span>
                  </TableCell>
                  <TableCell className="text-sm hidden md:table-cell text-muted-foreground">{file.file_type || "—"}</TableCell>
                  <TableCell className="text-sm hidden md:table-cell text-muted-foreground">{formatSize(file.file_size)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{format(new Date(file.created_at), "MMM d, yyyy")}</TableCell>
                  <TableCell>
                    <div className="flex gap-0.5">
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-primary/10 text-primary" onClick={() => handleDownload(file)}><Download className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-destructive/10 text-destructive" onClick={() => handleDelete(file)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {files.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No files uploaded yet. Click "Upload Files" to get started.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
