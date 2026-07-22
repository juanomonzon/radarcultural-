import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MapPopupProps {
  nombre: string;
  color: string;
  hasEvent: boolean;
  onOpenGallery: () => void;
  onOpenEventos: () => void;
}

interface EventoPreview {
  titulo: string;
  descripcion: string | null;
  fecha_evento: string | null;
  instagram_url: string | null;
}

const MapPopup = ({ nombre, color, hasEvent, onOpenGallery, onOpenEventos }: MapPopupProps) => {
  const query = encodeURIComponent(nombre + " Buenos Aires");
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
  const [preview, setPreview] = useState<EventoPreview | null>(null);

  useEffect(() => {
    if (!hasEvent) return;
    const fetchPreview = async () => {
      const { data } = await supabase
        .from("eventos")
        .select("titulo, descripcion, fecha_evento, instagram_url")
        .eq("lugar", nombre)
        .eq("estado", "aprobado")
        .order("fecha_evento", { ascending: true })
        .limit(1);
      if (data && data.length > 0) setPreview(data[0] as EventoPreview);
    };
    fetchPreview();
  }, [nombre, hasEvent]);

  return (
    <div className="text-center p-3 min-w-[180px]" style={{ fontFamily: "var(--font-body)" }}>
      <b className="text-sm block mb-2" style={{ color }}>
        {nombre}
      </b>

      {/* Event preview inline */}
      {preview && (
        <div className="text-left mb-3 p-2 rounded-md border" style={{ borderColor: `${color}40`, background: `${color}08` }}>
          <p className="text-[11px] font-bold text-gray-800 leading-tight">🔥 {preview.titulo}</p>
          {preview.descripcion && (
            <p className="text-[10px] text-gray-600 mt-0.5 leading-snug" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {preview.descripcion}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1">
            {preview.fecha_evento && (
              <span className="text-[10px] text-gray-500">📅 {preview.fecha_evento}</span>
            )}
            {preview.instagram_url && (
              <a
                href={preview.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-semibold no-underline"
                style={{ color }}
              >
                <i className="fab fa-instagram" /> IG
              </a>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <button
          onClick={() => window.open(mapsUrl, '_blank', 'noopener,noreferrer')}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-bold border-0 cursor-pointer"
          style={{ background: "#2A7FFF", color: "white" }}
        >
          📍 Cómo llegar
        </button>
        <button
          onClick={onOpenGallery}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-bold border-0 cursor-pointer"
          style={{ background: "#2ECC71", color: "white" }}
        >
          📸 Ver/Subir Fotos
        </button>
        <button
          onClick={onOpenEventos}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-bold border-0 cursor-pointer"
          style={{ background: "#9B59B6", color: "white" }}
        >
          📅 {hasEvent ? "Ver Eventos" : "Eventos"}
        </button>
      </div>
    </div>
  );
};

export default MapPopup;
