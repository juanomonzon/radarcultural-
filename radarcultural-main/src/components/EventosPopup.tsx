import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Evento {
  id: string;
  titulo: string;
  descripcion: string | null;
  fecha_evento: string | null;
  hora: string | null;
  instagram_url: string | null;
  imagen_url: string | null;
}

interface EventosPopupProps {
  lugar: string;
  color: string;
  onClose: () => void;
}

const EventosPopup = ({ lugar, color, onClose }: EventosPopupProps) => {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEventos = async () => {
      const { data } = await supabase
        .from("eventos")
        .select("id, titulo, descripcion, fecha_evento, hora, instagram_url, imagen_url")
        .eq("lugar", lugar)
        .eq("estado", "aprobado")
        .order("fecha_evento", { ascending: true });
      if (data) setEventos(data as Evento[]);
      setLoading(false);
    };
    fetchEventos();
  }, [lugar]);

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-foreground/70 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-sm max-h-[80vh] overflow-y-auto custom-scrollbar animate-fade-in">
        <div className="sticky top-0 bg-card border-b border-border p-4 flex justify-between items-center">
          <h2 className="font-display text-lg font-bold" style={{ color }}>
            📅 Eventos
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-2xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="p-4">
          <p className="text-xs text-muted-foreground mb-3">📍 {lugar}</p>
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando eventos...</p>
          ) : eventos.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay eventos próximos para este lugar.</p>
          ) : (
            <div className="space-y-3">
              {eventos.map((evt) => (
                <div key={evt.id} className="rounded-lg border border-border bg-background overflow-hidden">
                  {evt.imagen_url && (
                    <img
                      src={evt.imagen_url}
                      alt={evt.titulo}
                      className="w-full h-36 object-cover"
                      loading="lazy"
                    />
                  )}
                  <div className="p-3">
                    <p className="font-bold text-sm text-foreground">{evt.titulo}</p>
                    {evt.descripcion && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{evt.descripcion}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      {evt.fecha_evento && <span>📅 {evt.fecha_evento}</span>}
                      {evt.hora && <span>🕐 {evt.hora}</span>}
                    </div>
                    {evt.instagram_url && (
                      <a
                        href={evt.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold rounded-md px-3 py-1.5 transition-colors"
                        style={{ background: `${color}20`, color }}
                      >
                        <i className="fab fa-instagram" /> Ver en Instagram
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventosPopup;
