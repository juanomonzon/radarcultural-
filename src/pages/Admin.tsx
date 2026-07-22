import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { espacios } from "@/data/espacios";

interface Evento {
  id: string;
  lugar: string;
  titulo: string;
  descripcion: string | null;
  fecha_evento: string | null;
  hora: string | null;
  fuente_url: string | null;
  estado: string;
  created_at: string;
}

interface FuenteEvento {
  id: string;
  lugar: string;
  url: string;
  tipo: string;
  activa: boolean;
}

const Admin = () => {
  const { toast } = useToast();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [fuentes, setFuentes] = useState<FuenteEvento[]>([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [tab, setTab] = useState<"eventos" | "fuentes">("eventos");

  // New source form
  const [newLugar, setNewLugar] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newTipo, setNewTipo] = useState<"web" | "instagram">("web");

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [evtRes, fntRes] = await Promise.all([
      supabase.from("eventos").select("*").order("created_at", { ascending: false }),
      supabase.from("fuentes_eventos").select("*").order("lugar"),
    ]);
    if (evtRes.data) setEventos(evtRes.data as Evento[]);
    if (fntRes.data) setFuentes(fntRes.data as FuenteEvento[]);
    setLoading(false);
  };

  const updateEstado = async (id: string, estado: string) => {
    await supabase.from("eventos").update({ estado }).eq("id", id);
    setEventos((prev) => prev.map((e) => (e.id === id ? { ...e, estado } : e)));
    toast({ title: estado === "aprobado" ? "✅ Evento aprobado" : "❌ Evento rechazado" });
  };

  const addFuente = async () => {
    if (!newLugar || !newUrl) return;
    const { error } = await supabase.from("fuentes_eventos").insert({
      lugar: newLugar,
      url: newUrl,
      tipo: newTipo,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "✅ Fuente agregada" });
      setNewLugar("");
      setNewUrl("");
      fetchAll();
    }
  };

  const runScraping = async () => {
    setScraping(true);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-eventos");
      if (error) throw error;
      toast({ title: "Scraping completado", description: `${data?.events || 0} eventos encontrados` });
      fetchAll();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setScraping(false);
    }
  };

  const lugaresUnicos = [...new Set(espacios.map((e) => e.n))].sort();

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground font-display">
            🎭 Admin — Eventos Culturales
          </h1>
          <a href="/" className="text-sm text-primary hover:underline">← Volver al mapa</a>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={tab === "eventos" ? "default" : "outline"}
            onClick={() => setTab("eventos")}
          >
            Eventos ({eventos.length})
          </Button>
          <Button
            variant={tab === "fuentes" ? "default" : "outline"}
            onClick={() => setTab("fuentes")}
          >
            Fuentes ({fuentes.length})
          </Button>
          <Button onClick={runScraping} disabled={scraping} variant="secondary" className="ml-auto">
            {scraping ? "Scrapeando..." : "🔄 Scrapear ahora"}
          </Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Cargando...</p>
        ) : tab === "eventos" ? (
          <div className="space-y-3">
            {eventos.length === 0 ? (
              <p className="text-muted-foreground text-sm">No hay eventos. Agregá fuentes y ejecutá el scraping.</p>
            ) : (
              eventos.map((evt) => (
                <div
                  key={evt.id}
                  className={`p-4 rounded-lg border ${
                    evt.estado === "aprobado"
                      ? "border-secondary/50 bg-secondary/5"
                      : evt.estado === "rechazado"
                      ? "border-destructive/30 bg-destructive/5 opacity-60"
                      : "border-border bg-card"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-bold text-sm text-foreground">{evt.titulo}</p>
                      <p className="text-xs text-muted-foreground mt-1">📍 {evt.lugar}</p>
                      {evt.descripcion && (
                        <p className="text-xs text-foreground/80 mt-1">{evt.descripcion}</p>
                      )}
                      <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                        {evt.fecha_evento && <span>📅 {evt.fecha_evento}</span>}
                        {evt.hora && <span>🕐 {evt.hora}</span>}
                      </div>
                      {evt.fuente_url && (
                        <a
                          href={evt.fuente_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline mt-1 inline-block"
                        >
                          Ver fuente →
                        </a>
                      )}
                    </div>
                    {evt.estado === "pendiente" && (
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => updateEstado(evt.id, "aprobado")}
                        >
                          ✅
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateEstado(evt.id, "rechazado")}
                        >
                          ❌
                        </Button>
                      </div>
                    )}
                    {evt.estado !== "pendiente" && (
                      <span className={`text-xs px-2 py-1 rounded ${
                        evt.estado === "aprobado" ? "bg-secondary/20 text-secondary" : "bg-destructive/20 text-destructive"
                      }`}>
                        {evt.estado}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Add source form */}
            <div className="p-4 rounded-lg border border-border bg-card space-y-3">
              <p className="font-bold text-sm text-foreground">Agregar fuente de eventos</p>
              <select
                value={newLugar}
                onChange={(e) => setNewLugar(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground"
              >
                <option value="">Seleccionar lugar...</option>
                {lugaresUnicos.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              <Input
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="URL del sitio web o perfil de Instagram"
              />
              <div className="flex gap-3 items-center">
                <label className="flex items-center gap-1 text-sm">
                  <input
                    type="radio"
                    checked={newTipo === "web"}
                    onChange={() => setNewTipo("web")}
                  />
                  Web
                </label>
                <label className="flex items-center gap-1 text-sm">
                  <input
                    type="radio"
                    checked={newTipo === "instagram"}
                    onChange={() => setNewTipo("instagram")}
                  />
                  Instagram
                </label>
                <Button onClick={addFuente} size="sm" className="ml-auto">
                  Agregar
                </Button>
              </div>
            </div>

            {/* Sources list */}
            {fuentes.map((f) => (
              <div key={f.id} className="p-3 rounded-lg border border-border bg-card flex items-center gap-3">
                <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                  {f.tipo}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{f.lugar}</p>
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline truncate block"
                  >
                    {f.url}
                  </a>
                </div>
                <span className={`text-xs ${f.activa ? "text-secondary" : "text-muted-foreground"}`}>
                  {f.activa ? "Activa" : "Inactiva"}
                </span>
              </div>
            ))}
            {fuentes.length === 0 && (
              <p className="text-sm text-muted-foreground">No hay fuentes configuradas.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
