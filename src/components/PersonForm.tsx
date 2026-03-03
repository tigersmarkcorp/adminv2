import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, Upload, Camera } from "lucide-react";

interface Field {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  options?: string[];
}

interface PersonFormProps {
  fields: Field[];
  tableName: string;
  photoBucket: string;
  onSuccess: () => void;
  onCancel: () => void;
  editData?: Record<string, any> | null;
  govIdFields?: string[];
}

const GOV_ID_KEYS = ["nbi_number", "philhealth_number", "sss_number", "pagibig_number", "tin_number"];

export function PersonForm({ fields, tableName, photoBucket, onSuccess, onCancel, editData, govIdFields }: PersonFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(editData || {});
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(editData?.photo_url || null);
  const [loading, setLoading] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let photo_url = formData.photo_url || null;

      if (photo) {
        const ext = photo.name.split(".").pop();
        const path = `${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from(photoBucket)
          .upload(path, photo);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from(photoBucket).getPublicUrl(path);
        photo_url = urlData.publicUrl;
      }

      // Separate gov ID fields from main data
      const govData: Record<string, any> = {};
      const mainData: Record<string, any> = {};
      
      for (const [key, value] of Object.entries({ ...formData, photo_url })) {
        if (GOV_ID_KEYS.includes(key)) {
          govData[key] = value || null;
        } else {
          mainData[key] = value;
        }
      }

      // Remove internal fields
      delete mainData._gov_id;

      if (editData?.id) {
        const { error } = await supabase.from(tableName as any).update(mainData as any).eq("id", editData.id);
        if (error) throw error;

        // Update gov IDs for employees
        if (govIdFields && Object.keys(govData).length > 0 && tableName === "employees") {
          if (editData._gov_id) {
            await (supabase as any).from("employee_government_ids").update(govData).eq("id", editData._gov_id);
          } else if (editData.auth_user_id) {
            await (supabase as any).from("employee_government_ids").insert({
              ...govData,
              employee_id: editData.id,
              auth_user_id: editData.auth_user_id,
            });
          }
        }

        toast({ title: "Updated successfully!" });
      } else {
        const { data: inserted, error } = await supabase.from(tableName as any).insert(mainData as any).select().single();
        if (error) throw error;
        toast({ title: "Created successfully!" });
      }
      onSuccess();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const isEmergencyField = (name: string) => name.startsWith("emergency_contact");
  const isGovIdField = (name: string) => GOV_ID_KEYS.includes(name);

  const renderField = (field: Field) => {
    if (field.name === "gender") {
      return (
        <Select value={formData[field.name] || ""} onValueChange={(v) => setFormData({ ...formData, [field.name]: v })}>
          <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select gender" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Male">Male</SelectItem>
            <SelectItem value="Female">Female</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      );
    }
    if (field.name === "status") {
      return (
        <Select value={formData[field.name] || "Active"} onValueChange={(v) => setFormData({ ...formData, [field.name]: v })}>
          <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      );
    }
    if (field.name === "schedule_type") {
      return (
        <Select value={formData[field.name] || "Fixed"} onValueChange={(v) => setFormData({ ...formData, [field.name]: v })}>
          <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Fixed">Fixed</SelectItem>
            <SelectItem value="Flexible">Flexible</SelectItem>
          </SelectContent>
        </Select>
      );
    }
    if (field.options) {
      return (
        <Select value={formData[field.name] || ""} onValueChange={(v) => setFormData({ ...formData, [field.name]: v })}>
          <SelectTrigger className="rounded-xl"><SelectValue placeholder={`Select ${field.label}`} /></SelectTrigger>
          <SelectContent>
            {field.options.map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    if (field.name === "address") {
      return (
        <Textarea
          id={field.name}
          value={formData[field.name] || ""}
          onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
          required={field.required}
          className="rounded-xl"
        />
      );
    }
    return (
      <Input
        id={field.name}
        type={field.type || "text"}
        value={formData[field.name] || ""}
        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
        required={field.required}
        className="rounded-xl"
      />
    );
  };

  const regularFields = fields.filter(f => !isEmergencyField(f.name) && !isGovIdField(f.name));
  const govFields = fields.filter(f => isGovIdField(f.name));
  const emergencyFields = fields.filter(f => isEmergencyField(f.name));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Photo Upload */}
      <div className="flex flex-col items-center gap-3 pb-4 border-b border-border/40">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-muted border-2 border-dashed border-primary/30 flex items-center justify-center overflow-hidden">
            {photoPreview ? (
              <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <Camera className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          <label htmlFor="photo" className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full gradient-primary flex items-center justify-center cursor-pointer shadow-md">
            <Upload className="w-3.5 h-3.5 text-white" />
          </label>
        </div>
        <p className="text-xs text-muted-foreground">Profile Image</p>
        <Input id="photo" type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
      </div>

      {/* Regular Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {regularFields.map((field) => (
          <div key={field.name} className="space-y-1.5">
            <Label htmlFor={field.name} className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{field.label}</Label>
            {renderField(field)}
          </div>
        ))}
      </div>

      {/* Government IDs Section */}
      {govFields.length > 0 && (
        <div className="pt-4 border-t border-border/40">
          <h4 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Government IDs
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-primary/5 rounded-xl p-4">
            {govFields.map((field) => (
              <div key={field.name} className="space-y-1.5">
                <Label htmlFor={field.name} className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{field.label}</Label>
                {renderField(field)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emergency Contact Section */}
      {emergencyFields.length > 0 && (
        <div className="pt-4 border-t border-border/40">
          <h4 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            In Case of Emergency
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-accent/50 rounded-xl p-4">
            {emergencyFields.map((field) => (
              <div key={field.name} className="space-y-1.5">
                <Label htmlFor={field.name} className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {field.label.replace("In Case of Emergency - ", "")}
                </Label>
                {renderField(field)}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-4 border-t border-border/40">
        <Button type="submit" className="gradient-primary text-white hover:opacity-90 rounded-xl glow-sm-primary" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          {editData?.id ? "Update" : "Create"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl">Cancel</Button>
      </div>
    </form>
  );
}
