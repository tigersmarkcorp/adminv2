import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FileText, Download, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileMeta {
  id: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  storage_path: string;
  created_at: string;
}

export default function EmployeeFiles() {
  const [files, setFiles] = useState<FileMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("portal-auth", {
        body: { action: "get-files" },
      });
      if (error) throw error;
      setFiles(data.files || []);
    } catch {
      setFiles([]);
    }
    setLoading(false);
  };

  const handleDownload = async (file: FileMeta) => {
    const { data } = supabase.storage.from("forms-files").getPublicUrl(file.storage_path);
    if (data?.publicUrl) {
      window.open(data.publicUrl, "_blank");
    }
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl gradient-employee flex items-center justify-center shadow-sm">
          <FolderOpen className="w-5 h-5 text-white" />
        </div>
        <div>
        <h1 className="text-2xl font-bold text-foreground">Forms & Files</h1>
        <p className="text-sm text-muted-foreground mt-1">Company documents and forms shared with you</p>
        </div>
      </div>

      {files.length === 0 ? (
        <div className="bg-card rounded-2xl border border-employee-soft p-12 text-center shadow-employee-panel">
          <FolderOpen className="w-12 h-12 text-primary/60 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No files available yet</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-employee-soft overflow-hidden shadow-employee-panel">
          <div className="divide-y divide-border/40">
            {files.map((file) => (
              <div key={file.id} className="flex items-center gap-4 p-4 hover:bg-employee-surface transition-colors">
                <div className="w-10 h-10 rounded-lg bg-employee-warm flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{file.file_name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {file.file_type || "File"} • {formatSize(file.file_size)} • {new Date(file.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleDownload(file)} className="gap-1.5 rounded-lg border-primary/20 text-employee-navy hover:bg-primary/10">
                  <Download className="w-3.5 h-3.5" />
                  Download
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
