import { Link } from "react-router-dom";
import {
  SportwagenIcon,
  LimousineIcon,
  KleinwagenIcon,
  KombiIcon,
  VanIcon,
  CabrioIcon,
  SUVIcon,
} from "@/lib/vehicleTypeIcons";

interface VehicleType {
  id: string;
  label: string;
  icon: React.ReactNode;
}

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
