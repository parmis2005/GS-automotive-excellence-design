// Mock vehicle data from GS Automobile Rheinland
// Images from cargate360.de - using real vehicle IDs from the website
import type { Vehicle } from "@/types/vehicle";

// Helper function to build cargate360 image URL
// vid = vehicle ID, bid = business ID (1790 for GS Automobile), ino = image number
const cargateImage = (vid: string, ino: number = 1, format: string = "xlrm") => {
  return `https://img.cargate360.de/default.aspx?vid=${vid}&bid=1790&format=${format}&ino=${ino}&app=Kiste-Default`;
};

// Real vehicle data from https://fahrzeuge.gs-automobile-rheinland.de/Fahrzeugsuche/Fahrzeugliste?st=2
// TODO: Replace with API call later
export const vehicles: Vehicle[] = [
  {
    id: "8738290",
    image: cargateImage("8738290", 1),
    brand: "BMW",
    model: "i4 eDrive40 GC M-SPORT-PRO",
    price: 52500,
    year: 2025,
    mileage: 0, // Will be updated when we have the data
    fuel: "Elektro",
    isNew: true,
    transmission: "Automatik",
  },
  {
    id: "8632722",
    image: cargateImage("8632722", 1),
    brand: "Volkswagen",
    model: "T7 Multivan 2.0TDI Lang EDITION",
    price: 45000, // Estimated - will be updated
    year: 2024,
    mileage: 15000,
    fuel: "Diesel",
    isNew: false,
    transmission: "Automatik",
  },
  {
    id: "8409264",
    image: cargateImage("8409264", 1),
    brand: "BMW",
    model: "320d",
    price: 32000,
    year: 2023,
    mileage: 25000,
    fuel: "Diesel",
    isNew: false,
    transmission: "Automatik",
  },
  {
    id: "8809357",
    image: cargateImage("8809357", 1),
    brand: "Mercedes-Benz",
    model: "C 300",
    price: 48000,
    year: 2023,
    mileage: 20000,
    fuel: "Benzin",
    isNew: false,
    transmission: "Automatik",
  },
  {
    id: "8782687",
    image: cargateImage("8782687", 1),
    brand: "Audi",
    model: "A4 Avant 40 TDI",
    price: 39000,
    year: 2023,
    mileage: 18000,
    fuel: "Diesel",
    isNew: false,
    transmission: "Automatik",
  },
  {
    id: "8739283",
    image: cargateImage("8739283", 1),
    brand: "BMW",
    model: "X3 xDrive30d",
    price: 52000,
    year: 2023,
    mileage: 22000,
    fuel: "Diesel",
    isNew: false,
    transmission: "Automatik",
  },
];

// Future API function placeholder
// export async function fetchVehicles(): Promise<Vehicle[]> {
//   const response = await fetch('/api/vehicles');
//   const data = await response.json();
//   return data.map((v: any) => ({
//     ...v,
//     image: cargateImage(v.id, 1)
//   }));
// }
