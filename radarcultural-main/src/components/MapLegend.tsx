import { CATEGORIAS, CategoryKey } from "@/data/espacios";

interface MapLegendProps {
  activeFilter: CategoryKey | "TODOS";
  onFilterChange: (filter: CategoryKey | "TODOS") => void;
}

const MapLegend = ({ activeFilter, onFilterChange }: MapLegendProps) => {
  return (
    <div className="absolute top-4 left-4 z-[1000] bg-card/95 backdrop-blur-md p-4 rounded-lg shadow-lg border border-border w-56 animate-slide-in">
      <h4 className="font-display text-sm font-bold text-primary border-b border-border pb-2 mb-3 tracking-wide">
        RADAR CULTURAL
      </h4>

      <button
        onClick={() => onFilterChange("TODOS")}
        className={`flex items-center w-full gap-2.5 py-1.5 px-2 rounded-md text-xs font-semibold transition-all mb-1 ${
          activeFilter === "TODOS"
            ? "bg-primary/10 text-primary"
            : "text-foreground hover:bg-muted"
        }`}
      >
        <i className="fas fa-layer-group text-sm text-muted-foreground" />
        Todos
      </button>

      {(Object.entries(CATEGORIAS) as [CategoryKey, typeof CATEGORIAS[CategoryKey]][]).map(
        ([key, cat]) => (
          <button
            key={key}
            onClick={() => onFilterChange(key)}
            className={`flex items-center w-full gap-2.5 py-1.5 px-2 rounded-md text-xs font-semibold transition-all mb-1 ${
              activeFilter === key
                ? "bg-primary/10 text-primary"
                : "text-foreground hover:bg-muted"
            }`}
          >
            <i className={`fas ${cat.icon} text-sm`} style={{ color: cat.color }} />
            {cat.label}
          </button>
        )
      )}

      <hr className="border-border my-3" />
      <div className="text-center">
        <p className="text-[10px] text-muted-foreground mb-2">Creado por:</p>
        <a
          href="https://instagram.com/juano.monzon"
          target="_blank"
          rel="noopener noreferrer"
          className="block text-[11px] font-bold text-primary-foreground py-1.5 rounded-md"
          style={{
            background:
              "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
          }}
        >
          <i className="fab fa-instagram mr-1" /> Juano Monzon
        </a>
      </div>
    </div>
  );
};

export default MapLegend;
