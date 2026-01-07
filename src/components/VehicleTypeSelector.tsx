import { Link } from "react-router-dom";

interface VehicleType {
  id: string;
  label: string;
  icon: React.ReactNode;
}

// Custom SVG icons for each vehicle type
const SportwagenIcon = () => (
  <svg viewBox="0 0 64 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <path d="M8 20 L12 24 L52 24 L56 20 L56 16 L52 12 L48 12 L44 8 L20 8 L16 12 L12 12 L8 16 Z" fill="currentColor" />
    <circle cx="16" cy="24" r="4" fill="currentColor" />
    <circle cx="48" cy="24" r="4" fill="currentColor" />
    <path d="M28 12 L36 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const LimousineIcon = () => (
  <svg viewBox="0 0 64 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <path d="M8 20 L10 24 L54 24 L56 20 L56 16 L52 12 L48 12 L44 8 L20 8 L16 12 L12 12 L8 16 Z" fill="currentColor" />
    <circle cx="18" cy="24" r="4" fill="currentColor" />
    <circle cx="46" cy="24" r="4" fill="currentColor" />
    <rect x="20" y="12" width="24" height="8" fill="currentColor" opacity="0.3" />
  </svg>
);

const KleinwagenIcon = () => (
  <svg viewBox="0 0 64 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <path d="M12 20 L14 24 L50 24 L52 20 L52 16 L48 12 L44 12 L40 8 L24 8 L20 12 L16 12 L12 16 Z" fill="currentColor" />
    <circle cx="18" cy="24" r="3.5" fill="currentColor" />
    <circle cx="46" cy="24" r="3.5" fill="currentColor" />
    <rect x="22" y="12" width="20" height="6" fill="currentColor" opacity="0.3" />
  </svg>
);

const KombiIcon = () => (
  <svg viewBox="0 0 64 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <path d="M8 20 L10 24 L54 24 L56 20 L56 16 L52 12 L48 12 L44 8 L20 8 L16 12 L12 12 L8 16 Z" fill="currentColor" />
    <path d="M46 12 L50 12 L54 16 L54 20 L50 20 Z" fill="currentColor" />
    <circle cx="18" cy="24" r="4" fill="currentColor" />
    <circle cx="46" cy="24" r="4" fill="currentColor" />
    <rect x="20" y="12" width="24" height="8" fill="currentColor" opacity="0.3" />
  </svg>
);

const VanIcon = () => (
  <svg viewBox="0 0 64 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <path d="M8 18 L10 24 L54 24 L56 18 L56 14 L52 10 L48 10 L44 8 L20 8 L16 10 L12 10 L8 14 Z" fill="currentColor" />
    <circle cx="18" cy="24" r="4" fill="currentColor" />
    <circle cx="46" cy="24" r="4" fill="currentColor" />
    <rect x="20" y="10" width="28" height="10" fill="currentColor" opacity="0.3" />
  </svg>
);

const CabrioIcon = () => (
  <svg viewBox="0 0 64 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <path d="M8 20 L12 24 L52 24 L56 20 L56 16 L52 12 L48 12 L44 8 L20 8 L16 12 L12 12 L8 16 Z" fill="currentColor" />
    <path d="M24 12 L40 12 L40 10 L36 8 L28 8 L24 10 Z" fill="currentColor" opacity="0.4" />
    <circle cx="16" cy="24" r="4" fill="currentColor" />
    <circle cx="48" cy="24" r="4" fill="currentColor" />
  </svg>
);

const SUVIcon = () => (
  <svg viewBox="0 0 64 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <path d="M8 18 L10 26 L54 26 L56 18 L56 14 L52 10 L48 10 L44 8 L20 8 L16 10 L12 10 L8 14 Z" fill="currentColor" />
    <circle cx="18" cy="26" r="4" fill="currentColor" />
    <circle cx="46" cy="26" r="4" fill="currentColor" />
    <rect x="22" y="12" width="20" height="8" fill="currentColor" opacity="0.3" />
    <rect x="48" y="12" width="6" height="6" fill="currentColor" opacity="0.5" />
  </svg>
);

const vehicleTypes: VehicleType[] = [
  {
    id: "Sportwagen",
    label: "Sportwagen",
    icon: <div className="w-10 h-10 md:w-12 md:h-12"><SportwagenIcon /></div>,
  },
  {
    id: "Limousine",
    label: "Limousine",
    icon: <div className="w-10 h-10 md:w-12 md:h-12"><LimousineIcon /></div>,
  },
  {
    id: "Kleinwagen",
    label: "Kleinwagen",
    icon: <div className="w-10 h-10 md:w-12 md:h-12"><KleinwagenIcon /></div>,
  },
  {
    id: "Kombi",
    label: "Kombi",
    icon: <div className="w-10 h-10 md:w-12 md:h-12"><KombiIcon /></div>,
  },
  {
    id: "Van",
    label: "Van/Minibus",
    icon: <div className="w-10 h-10 md:w-12 md:h-12"><VanIcon /></div>,
  },
  {
    id: "Cabrio",
    label: "Cabriolet/Roadster",
    icon: <div className="w-10 h-10 md:w-12 md:h-12"><CabrioIcon /></div>,
  },
  {
    id: "SUV",
    label: "SUV",
    icon: <div className="w-10 h-10 md:w-12 md:h-12"><SUVIcon /></div>,
  },
];

const VehicleTypeSelector = () => {
  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-10 md:mb-12 text-primary">
          Welcher Typ passt zu Deinem Leben?
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 md:gap-6">
          {vehicleTypes.map((type) => (
            <Link
              key={type.id}
              to={`/fahrzeuge?vehicleType=${encodeURIComponent(type.id)}`}
              className="group flex flex-col items-center justify-center p-6 md:p-8 border-2 border-gray-200 rounded-lg bg-white hover:border-primary hover:shadow-lg transition-all duration-300 cursor-pointer"
            >
              <div className="text-primary mb-4 group-hover:scale-110 transition-transform duration-300">
                {type.icon}
              </div>
              <span className="text-sm md:text-base font-medium text-gray-700 text-center group-hover:text-primary transition-colors">
                {type.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default VehicleTypeSelector;
