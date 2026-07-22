import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Photo {
  id: string;
  url: string;
  autor: string;
  instagram: string;
}

interface PhotoGalleryModalProps {
  lugar: string | null;
  color: string;
  onClose: () => void;
}

const PhotoGalleryModal = ({ lugar, color, onClose }: PhotoGalleryModalProps) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [nombre, setNombre] = useState("");
  const [instagram, setInstagram] = useState("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (lugar) fetchPhotos();
  }, [lugar]);

  const fetchPhotos = async () => {
    if (!lugar) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("fotos")
      .select("*")
      .eq("lugar", lugar)
      .order("created_at", { ascending: false });

    if (!error && data) setPhotos(data);
    setLoading(false);
  };

  const handleUpload = async () => {
    if (!file || !lugar) return;
    setUploading(true);

    try {
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const filePath = `${lugar}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("fotos")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("fotos")
        .getPublicUrl(filePath);

      await supabase.from("fotos").insert({
        lugar,
        autor: nombre || "Anónimo",
        instagram: instagram || "",
        url: urlData.publicUrl,
      });

      // Send email notification (fire and forget)
      supabase.functions.invoke("notify-photo-upload", {
        body: {
          lugar,
          autor: nombre || "Anónimo",
          instagram: instagram || "",
          photoUrl: urlData.publicUrl,
        },
      }).catch((err) => console.error("Email notification failed:", err));

      setNombre("");
      setInstagram("");
      setFile(null);
      // Reset file input
      const input = document.getElementById("foto-input") as HTMLInputElement;
      if (input) input.value = "";
      
      await fetchPhotos();
    } catch (e) {
      console.error("Error uploading:", e);
      alert("Error al subir la foto. Intentá de nuevo.");
    } finally {
      setUploading(false);
    }
  };

  if (!lugar) return null;

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-foreground/70 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar animate-fade-in">
        <div className="sticky top-0 bg-card border-b border-border p-4 flex justify-between items-center">
          <h2 className="font-display text-lg font-bold" style={{ color }}>
            {lugar}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-2xl leading-none transition-colors"
          >
            ×
          </button>
        </div>

        <div className="p-4">
          {/* Gallery */}
          <p className="text-xs font-bold text-foreground mb-2">
            Galería de la Comunidad
          </p>
          <div className="grid grid-cols-2 gap-2 mb-4 max-h-60 overflow-y-auto custom-scrollbar">
            {loading ? (
              <p className="col-span-2 text-xs text-muted-foreground">
                Cargando...
              </p>
            ) : photos.length === 0 ? (
              <p className="col-span-2 text-xs text-muted-foreground">
                Sin fotos aún. ¡Sé el primero!
              </p>
            ) : (
              photos.map((f) => (
                <div key={f.id}>
                  <img
                    src={f.url}
                    alt={`Foto de ${f.autor}`}
                    className="w-full h-28 object-cover rounded-lg border border-border"
                  />
                  <p className="text-[9px] text-muted-foreground text-center mt-1">
                    Por: {f.autor}
                    {f.instagram && (
                      <span className="block">@{f.instagram.replace("@", "")}</span>
                    )}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Upload form */}
          <hr className="border-border mb-4" />
          <p className="text-xs font-bold text-foreground mb-3">Subí tu foto:</p>

          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Tu nombre o comentario"
            className="w-full px-3 py-2.5 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground mb-2 focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            type="text"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder="@ Tu Instagram"
            className="w-full px-3 py-2.5 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground mb-2 focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            id="foto-input"
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-muted-foreground mb-3 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-secondary file:text-secondary-foreground file:font-semibold file:text-xs file:cursor-pointer"
          />
          <button
            onClick={handleUpload}
            disabled={uploading || !file}
            className="w-full py-2.5 bg-secondary text-secondary-foreground font-bold text-sm rounded-md transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? "Subiendo..." : "Enviar Foto"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhotoGalleryModal;
