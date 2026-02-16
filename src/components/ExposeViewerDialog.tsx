import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink } from "lucide-react";
import { getExposeUrl } from "@/lib/exposeUtils";

interface ExposeViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exposeUrl?: string | null;
  offerUrl?: string | null;
  vehicleId: string;
  vehicleName?: string;
}

function buildApiUrl(path: string): string {
  const apiBase = (import.meta.env.VITE_API_URL || "").trim();
  if (!apiBase) return path;
  const normalizedBase = apiBase.endsWith("/") ? apiBase.slice(0, -1) : apiBase;
  return `${normalizedBase}${path}`;
}

export function ExposeViewerDialog({
  open,
  onOpenChange,
  exposeUrl,
  offerUrl,
  vehicleId,
  vehicleName,
}: ExposeViewerDialogProps) {
  const directExposeUrl = getExposeUrl(exposeUrl, offerUrl, vehicleId) ?? null;
  const viewApiUrl = buildApiUrl(`/api/vehicles/${vehicleId}/expose/view`);
  const redirectApiUrl = buildApiUrl(`/api/vehicles/${vehicleId}/expose`);
  const iframeUrl = directExposeUrl ?? viewApiUrl;
  const openInNewTabUrl = directExposeUrl ?? redirectApiUrl;
  const downloadUrl = directExposeUrl ?? `${viewApiUrl}${viewApiUrl.includes("?") ? "&" : "?"}download=1`;

  const handleOpenInNewTab = () => {
    window.open(openInNewTabUrl, "_blank", "noopener,noreferrer");
  };

  const handleDownload = () => {
    window.open(downloadUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col gap-4 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-0 shrink-0">
          <DialogTitle>{vehicleName ? `Exposé: ${vehicleName}` : "Exposé PDF"}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 flex flex-col gap-4 px-6 pb-6">
          <div className="flex-1 min-h-0 rounded-lg border bg-muted/30 overflow-hidden">
            <iframe
              src={`${iframeUrl}#toolbar=1`}
              title="Exposé PDF"
              className="w-full h-full min-h-[400px]"
            />
          </div>
          <div className="flex justify-end gap-2 shrink-0">
            <Button variant="outline" onClick={handleOpenInNewTab}>
              <ExternalLink className="w-4 h-4 mr-2" />
              In neuem Tab öffnen
            </Button>
            <Button onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              PDF herunterladen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
