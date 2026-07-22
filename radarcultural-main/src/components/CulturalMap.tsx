import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { createRoot } from "react-dom/client";
import { espacios, CATEGORIAS, CategoryKey } from "@/data/espacios";
import { supabase } from "@/integrations/supabase/client";
import MapLegend from "./MapLegend";
import MapPopup from "./MapPopup";
import PhotoGalleryModal from "./PhotoGalleryModal";
import EventosPopup from "./EventosPopup";

const CulturalMap = () => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const [activeFilter, setActiveFilter] = useState<CategoryKey | "TODOS">("TODOS");
  const [galleryPlace, setGalleryPlace] = useState<string | null>(null);
  const [galleryColor, setGalleryColor] = useState("#333");
  const [eventosPlace, setEventosPlace] = useState<string | null>(null);
  const [eventosColor, setEventosColor] = useState("#333");
  const [isDark, setIsDark] = useState(false);
  const [placesWithEvents, setPlacesWithEvents] = useState<Set<string>>(new Set());
  const lightTilesRef = useRef<L.TileLayer | null>(null);
  const darkTilesRef = useRef<L.TileLayer | null>(null);

  // Fetch places that have approved events
  useEffect(() => {
    const fetchPlacesWithEvents = async () => {
      const { data } = await supabase
        .from("eventos")
        .select("lugar")
        .eq("estado", "aprobado");
      if (data) {
        setPlacesWithEvents(new Set(data.map((e: { lugar: string }) => e.lugar)));
      }
    };
    fetchPlacesWithEvents();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView([-34.6037, -58.3816], 13);
    mapRef.current = map;

    lightTilesRef.current = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    ).addTo(map);

    darkTilesRef.current = L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    );

    markersGroupRef.current.addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const createIcon = useCallback((color: string, faIcon: string, hasEvent: boolean) => {
    const eventClass = hasEvent ? ' has-event' : '';
    return L.divIcon({
      className: "custom-div-icon",
      html: `<div class="custom-pin${eventClass}" style="background:${color};color:${color}"><i class="fas ${faIcon}"></i></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });
  }, []);

  // Update markers when filter or events change
  useEffect(() => {
    const group = markersGroupRef.current;
    group.clearLayers();

    espacios.forEach((lugar) => {
      if (activeFilter !== "TODOS" && lugar.cat !== activeFilter) return;

      const cat = CATEGORIAS[lugar.cat];
      const hasEvent = placesWithEvents.has(lugar.n);
      const icon = createIcon(cat.color, cat.icon, hasEvent);
      const marker = L.marker(lugar.c, { icon });

      const popupDiv = document.createElement("div");
      const root = createRoot(popupDiv);
      root.render(
        <MapPopup
          nombre={lugar.n}
          color={cat.color}
          hasEvent={hasEvent}
          onOpenGallery={() => {
            setGalleryPlace(lugar.n);
            setGalleryColor(cat.color);
            mapRef.current?.closePopup();
          }}
          onOpenEventos={() => {
            setEventosPlace(lugar.n);
            setEventosColor(cat.color);
            mapRef.current?.closePopup();
          }}
        />
      );

      marker.bindPopup(popupDiv);
      group.addLayer(marker);
    });
  }, [activeFilter, createIcon, placesWithEvents]);

  const handleLocateMe = () => {
    mapRef.current?.locate({ setView: true, maxZoom: 16 });
  };

  const toggleDarkMode = () => {
    const map = mapRef.current;
    if (!map) return;
    if (isDark) {
      if (darkTilesRef.current) map.removeLayer(darkTilesRef.current);
      if (lightTilesRef.current) lightTilesRef.current.addTo(map);
    } else {
      if (lightTilesRef.current) map.removeLayer(lightTilesRef.current);
      if (darkTilesRef.current) darkTilesRef.current.addTo(map);
    }
    setIsDark(!isDark);
  };

  return (
    <div className="relative w-full h-screen">
      <div ref={mapContainerRef} className="w-full h-full" />

      <MapLegend activeFilter={activeFilter} onFilterChange={setActiveFilter} />

      {/* Floating controls */}
      <div className="absolute bottom-8 right-5 flex flex-col gap-3 z-[1000]">
        <button
          onClick={toggleDarkMode}
          className="w-12 h-12 rounded-full bg-card border border-border shadow-lg flex items-center justify-center text-foreground text-lg transition-transform hover:scale-110"
        >
          <i className={`fas ${isDark ? "fa-sun" : "fa-moon"}`} />
        </button>
        <button
          onClick={handleLocateMe}
          className="w-12 h-12 rounded-full bg-card border border-border shadow-lg flex items-center justify-center text-foreground text-lg transition-transform hover:scale-110"
        >
          <i className="fas fa-location-arrow" />
        </button>
      </div>

      {galleryPlace && (
        <PhotoGalleryModal
          lugar={galleryPlace}
          color={galleryColor}
          onClose={() => setGalleryPlace(null)}
        />
      )}

      {eventosPlace && (
        <EventosPopup
          lugar={eventosPlace}
          color={eventosColor}
          onClose={() => setEventosPlace(null)}
        />
      )}
    </div>
  );
};

export default CulturalMap;
