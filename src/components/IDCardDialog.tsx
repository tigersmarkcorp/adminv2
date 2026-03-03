import { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Flame } from "lucide-react";
import { format } from "date-fns";

interface IDCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  person: {
    full_name: string;
    photo_url?: string | null;
    email?: string | null;
    phone?: string | null;
    status: string;
    emergency_contact_name?: string | null;
    emergency_contact_phone?: string | null;
    employee_id?: string | null;
    position?: string | null;
    department?: string | null;
    date_hired?: string | null;
    worker_id?: string | null;
    job_role?: string | null;
    assignment_area?: string | null;
    date_started?: string | null;
  } | null;
  type: "employee" | "worker";
}

export function IDCardDialog({ open, onOpenChange, person, type }: IDCardDialogProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  if (!person) return null;

  const idNumber = type === "employee" ? person.employee_id : person.worker_id;
  const role = type === "employee" ? person.position : person.job_role;
  const dept = type === "employee" ? person.department : person.assignment_area;
  const hireDate = type === "employee" ? person.date_hired : person.date_started;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(cardRef.current, { scale: 3, backgroundColor: null, useCORS: true });
      const link = document.createElement("a");
      link.download = `ID-${person.full_name.replace(/\s+/g, "_")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      const printWindow = window.open("", "_blank");
      if (printWindow && cardRef.current) {
        printWindow.document.write(`<html><body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh">${cardRef.current.outerHTML}</body></html>`);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">ID Card Preview</DialogTitle>
        </DialogHeader>

        <div ref={cardRef} className="mx-auto w-[340px] rounded-2xl overflow-hidden shadow-2xl" style={{ fontFamily: "'Poppins', 'Inter', sans-serif" }}>
          {/* Top band - Orange gradient */}
          <div className="relative px-5 pt-5 pb-14" style={{ background: "linear-gradient(135deg, hsl(14, 100%, 50%), hsl(28, 100%, 55%))" }}>
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20" style={{ background: "radial-gradient(circle, white, transparent)" }} />
            <div className="flex items-center gap-2.5 mb-1 relative">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/20">
                <Flame className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-white uppercase tracking-widest" style={{ fontFamily: "'Poppins', sans-serif" }}>Admin Portal</p>
                <p className="text-[7px] text-white/60 uppercase tracking-[0.3em]">Enterprise System</p>
              </div>
            </div>
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[80px] h-[80px] rounded-full border-4 border-white bg-white overflow-hidden shadow-xl">
              {person.photo_url ? (
                <img src={person.photo_url} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl font-bold" style={{ background: "linear-gradient(135deg, hsl(14, 100%, 50%), hsl(28, 100%, 55%))", color: "white" }}>
                  {person.full_name.charAt(0)}
                </div>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="bg-white px-5 pt-14 pb-5 text-center">
            <h3 className="text-base font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>{person.full_name}</h3>
            <p className="text-xs font-semibold mt-0.5" style={{ color: "hsl(14, 100%, 50%)" }}>{role || "—"}</p>
            {dept && <p className="text-[10px] text-gray-500 mt-0.5">{dept}</p>}

            <div className="mt-4 bg-gray-50 rounded-xl p-3 space-y-2 text-left border border-gray-100">
              <Row label="ID Number" value={idNumber || "N/A"} />
              <Row label="Contact" value={person.phone || "—"} />
              <Row label="Email" value={person.email || "—"} />
              {hireDate && <Row label={type === "employee" ? "Date Hired" : "Date Started"} value={format(new Date(hireDate), "MMM d, yyyy")} />}
              <Row label="Status" value={person.status} highlight />
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-[7px] text-gray-400 uppercase tracking-[0.3em]">Emergency Contact</p>
              <p className="text-[11px] font-medium text-gray-700">{person.emergency_contact_name || "—"} • {person.emergency_contact_phone || "—"}</p>
            </div>
          </div>
        </div>

        <Button onClick={handleDownload} className="w-full mt-2 gradient-primary text-white hover:opacity-90 rounded-xl glow-sm-primary">
          <Download className="w-4 h-4 mr-2" /> Download ID Card
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center text-[11px]">
      <span className="text-gray-500">{label}</span>
      <span className={`font-semibold ${highlight ? "text-emerald-600" : "text-gray-800"}`}>{value}</span>
    </div>
  );
}
