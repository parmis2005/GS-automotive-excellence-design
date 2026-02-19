import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Share2, Mail, Link2 } from "lucide-react";
import { toast } from "sonner";

const WHATSAPP_SHARE_URL = "https://wa.me/?text=";

interface ShareVehicleButtonProps {
  vehicleUrl: string;
  label?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  /** Bei Karten/Listen: onClick z.B. e.stopPropagation() */
  onClick?: (e: React.MouseEvent) => void;
}

function getAbsoluteVehicleUrl(path: string): string {
  if (typeof window === "undefined") return path;
  const base = window.location.origin;
  return path.startsWith("http") ? path : `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function ShareVehicleButton({
  vehicleUrl,
  label = "Teilen",
  variant = "outline",
  size = "default",
  className,
  onClick,
}: ShareVehicleButtonProps) {
  const [open, setOpen] = useState(false);
  const absoluteUrl = getAbsoluteVehicleUrl(vehicleUrl);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(absoluteUrl);
      toast.success("Link kopiert", { description: "In WhatsApp oder anderer App einfügen zum Teilen." });
      setOpen(false);
    } catch {
      toast.error("Link konnte nicht kopiert werden.");
    }
  };

  const handleWhatsApp = () => {
    window.open(WHATSAPP_SHARE_URL + encodeURIComponent(absoluteUrl), "_blank", "noopener,noreferrer");
    setOpen(false);
  };

  const handleEmail = () => {
    const subject = encodeURIComponent("Fahrzeugangebot");
    const body = encodeURIComponent(`Ich möchte dir dieses Fahrzeug zeigen:\n\n${absoluteUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setOpen(false);
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={(e) => {
          onClick?.(e);
          setOpen(true);
        }}
      >
        <Share2 className="w-4 h-4 mr-2" />
        {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-border shadow-xl p-6 sm:p-8">
          <DialogHeader className="pr-8">
            <DialogTitle className="text-xl font-semibold text-foreground tracking-tight">
              Teilen
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <Button
              onClick={handleEmail}
              className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium h-11 text-base"
            >
              <Mail className="w-4 h-4 mr-2" />
              Als E-Mail teilen
            </Button>
            <Button
              onClick={handleCopyLink}
              className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium h-11 text-base"
            >
              <Link2 className="w-4 h-4 mr-2" />
              Link in Zwischenablage kopieren
            </Button>
            <Button
              onClick={handleWhatsApp}
              className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium h-11 text-base"
            >
              In WhatsApp teilen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
