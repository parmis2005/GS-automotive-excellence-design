import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText } from "lucide-react";

interface ExposeViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleName?: string;
}

export function ExposeViewerDialog({
  open,
  onOpenChange,
  vehicleName,
}: ExposeViewerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{vehicleName ? `Exposé: ${vehicleName}` : "Exposé PDF"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
          <div className="rounded-full bg-muted p-4">
            <FileText className="h-10 w-10 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">
            Diese Funktion ist in Kürze verfügbar.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
