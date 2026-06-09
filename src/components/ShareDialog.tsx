import { useEffect, useState } from "react";
import QRCode from "qrcode";
import type { Tournament } from "@/types";
import { exportTournamentPDF } from "@/services/pdfGenerator";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";

export function ShareDialog({ tournament, onClose }: { tournament: Tournament; onClose: () => void }) {
  const [qr, setQr] = useState("");
  const url = typeof window !== "undefined" ? `${window.location.origin}/torneo/${tournament.id}` : "";

  useEffect(() => { QRCode.toDataURL(url, { width: 220 }).then(setQr); }, [url]);

  const copyLink = async () => { await navigator.clipboard.writeText(url); alert("Enlace copiado"); };
  const shareWA = () => window.open(`https://wa.me/?text=${encodeURIComponent(`${tournament.name} – ${url}`)}`, "_blank");
  const shareMail = () => window.open(`mailto:?subject=${encodeURIComponent(tournament.name)}&body=${encodeURIComponent(url)}`);
  const downloadImage = async () => {
    const el = document.getElementById("tournament-canvas");
    if (!el) return;
    const canvas = await html2canvas(el, { backgroundColor: "#0F172A", scale: 2 });
    const link = document.createElement("a");
    link.download = `${tournament.name}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="glass neon-border w-full max-w-md rounded-2xl p-6"
        >
          <h3 className="font-display mb-4 text-xl uppercase tracking-widest">Compartir torneo</h3>
          {qr && <img src={qr} alt="QR" className="mx-auto mb-4 rounded-lg" />}
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => exportTournamentPDF(tournament)} className="btn-neon rounded-lg bg-primary py-2 text-sm font-semibold">📄 PDF</button>
            <button onClick={downloadImage} className="rounded-lg border border-border bg-secondary/40 py-2 text-sm">🖼 Imagen PNG</button>
            <button onClick={shareWA} className="rounded-lg border border-border bg-secondary/40 py-2 text-sm">💬 WhatsApp</button>
            <button onClick={shareMail} className="rounded-lg border border-border bg-secondary/40 py-2 text-sm">✉ Email</button>
            <button onClick={copyLink} className="col-span-2 rounded-lg border border-border bg-secondary/40 py-2 text-sm">🔗 Copiar enlace</button>
          </div>
          <button onClick={onClose} className="mt-4 w-full rounded-lg py-2 text-sm text-muted-foreground hover:text-foreground">Cerrar</button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
