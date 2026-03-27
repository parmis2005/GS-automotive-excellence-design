import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  clearVehiclePurchaseDraft,
  loadDraftFiles,
  loadDraftForVehicleInterestFromUrl,
  saveDraftFiles,
  saveDraftToSession,
} from "@/lib/vehiclePurchaseDraft";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ChevronRight,
  Info,
  Loader2,
  Minus,
  Plus,
  ImagePlus,
  Search,
} from "lucide-react";
import { useVehicles } from "@/hooks/useVehicles";
import { useBrands } from "@/hooks/useBrands";
import { getVehicleImageWithFallback } from "@/lib/vehicleImage";
import { getVehicleDisplayName } from "@/lib/vehicleNameUtils";
import { VehicleTitle } from "@/components/VehicleTitle";
import { getColorHex, BASIC_COLORS } from "@/lib/colorUtils";
import { useModels } from "@/hooks/useModels";
import { getPurchaseInquirySubUrl, getPurchaseInquiryUrl } from "@/lib/api/baseUrl";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import {
  SportwagenIcon,
  LimousineIcon,
  KleinwagenIcon,
  KombiIcon,
  VanIcon,
  CabrioIcon,
  SUVIcon,
} from "@/lib/vehicleTypeIcons";

const months = [
  "01",
  "02",
  "03",
  "04",
  "05",
  "06",
  "07",
  "08",
  "09",
  "10",
  "11",
  "12",
];

const currentDate = new Date();
const currentYear = currentDate.getFullYear();
const currentMonth = currentDate.getMonth() + 1;
const minYear = 1950;
const years = Array.from({ length: currentYear - minYear + 1 }, (_, index) =>
  String(currentYear - index),
);
const serviceYears = Array.from({ length: 4 }, (_, index) =>
  String(currentYear - index),
);
const huYears = Array.from({ length: 3 }, (_, index) =>
  String(currentYear + index),
);

const maxMileage = 300_000;
const minMileage = 0;
const maxOwners = 5;
const minModelLength = 2;
const minAccidentDescriptionLength = 10;
const maxPhotoFiles = 10;
const maxPhotoSizeMb = 5;
const maxTotalUploadSizeMb = 25;
const submitRequestTimeoutMs = 150_000;
const allowedUploadTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/gif",
  "application/pdf",
];

const defaultTopBrands = [
  "Volkswagen",
  "Mercedes-Benz",
  "BMW",
  "Audi",
  "Opel",
  "Ford",
  "Skoda",
  "Toyota",
  "Hyundai",
  "Renault",
  "Lynk & Co",
  "Seat",
  "Cupra",
  "Mazda",
];

const allowedBrands = [
  "Abarth",
  "Alfa Romeo",
  "Alpine",
  "Aston Martin",
  "Audi",
  "Bentley",
  "BMW",
  "BYD",
  "Chevrolet",
  "Chrysler",
  "Citroen",
  "Cupra",
  "Dacia",
  "Dodge",
  "DS",
  "Ferrari",
  "Fiat",
  "Ford",
  "Genesis",
  "Honda",
  "Hyundai",
  "Infiniti",
  "Jaguar",
  "Jeep",
  "Kia",
  "Lamborghini",
  "Lancia",
  "Land Rover",
  "Lexus",
  "Lotus",
  "Lynk & Co",
  "Maserati",
  "Mazda",
  "McLaren",
  "Mercedes-Benz",
  "Mini",
  "Mitsubishi",
  "Nissan",
  "Opel",
  "Peugeot",
  "Polestar",
  "Porsche",
  "Renault",
  "Rolls-Royce",
  "Saab",
  "Seat",
  "Skoda",
  "Smart",
  "Subaru",
  "Suzuki",
  "Tesla",
  "Toyota",
  "Volkswagen",
  "Volvo",
  "VW",
];

const popularModelsByMake: Record<string, string[]> = {
  "Abarth": ["595", "500", "124 Spider"],
  "Alfa Romeo": ["Giulia", "Stelvio", "Giulietta", "Tonale", "MiTo"],
  "Alpine": ["A110"],
  "Aston Martin": ["Vantage", "DB11", "DBX", "DBS"],
  "Audi": ["A3", "A4", "A6", "Q3", "Q5", "Q7"],
  "Bentley": ["Continental", "Bentayga", "Flying Spur"],
  "BMW": ["1er", "2er", "3er", "4er", "5er", "6er", "7er", "X1", "X2", "X3", "X4", "X5", "X6", "X7", "Z4", "i3", "i4", "i5", "i7", "iX", "iX3", "M2", "M3", "M4", "M5", "M8"],
  "BYD": ["Atto 3", "Han", "Tang", "Dolphin", "Seal"],
  "Chevrolet": ["Camaro", "Corvette", "Cruze", "Spark", "Tahoe"],
  "Chrysler": ["300", "Pacifica", "Voyager"],
  "Citroen": ["C3", "C4", "C5 Aircross", "Berlingo", "C1"],
  "Cupra": ["Formentor", "Leon", "Born", "Ateca"],
  "Dacia": ["Duster", "Sandero", "Logan", "Jogger"],
  "Dodge": ["Charger", "Challenger", "Durango"],
  "DS": ["DS 3", "DS 4", "DS 7"],
  "Ferrari": ["Roma", "F8", "488", "SF90", "Portofino"],
  "Fiat": ["500", "Panda", "Tipo", "500X", "Doblo"],
  "Ford": ["Focus", "Fiesta", "Kuga", "Puma", "Mondeo", "S-Max"],
  "Genesis": ["G70", "G80", "GV70", "GV80"],
  "Honda": ["Civic", "Accord", "CR-V", "HR-V", "Jazz"],
  "Hyundai": ["i10", "i20", "i30", "Tucson", "Kona", "Santa Fe"],
  "Infiniti": ["Q30", "Q50", "Q60", "QX30", "QX50"],
  "Jaguar": ["XE", "XF", "F-Pace", "E-Pace", "I-Pace"],
  "Jeep": ["Wrangler", "Compass", "Renegade", "Grand Cherokee", "Cherokee"],
  "Kia": ["Ceed", "Sportage", "Picanto", "Rio", "Sorento"],
  "Lamborghini": ["Huracan", "Aventador", "Urus"],
  "Lancia": ["Ypsilon", "Delta", "Thema"],
  "Land Rover": ["Range Rover", "Discovery", "Defender", "Range Rover Evoque"],
  "Lexus": ["IS", "ES", "RX", "NX", "UX"],
  "Lotus": ["Emira", "Elise", "Evora", "Exige"],
  "Lynk & Co": ["01", "02", "03", "05", "06"],
  "Maserati": ["Ghibli", "Levante", "Quattroporte", "Grecale"],
  "Mazda": ["Mazda3", "Mazda6", "CX-3", "CX-5", "MX-5"],
  "McLaren": ["570S", "720S", "GT", "Artura"],
  "Mercedes-Benz": ["C-Klasse", "E-Klasse", "A-Klasse", "GLC", "GLA", "S-Klasse"],
  "Mini": ["Cooper", "Countryman", "Clubman"],
  "Mitsubishi": ["Outlander", "ASX", "Eclipse Cross", "Space Star"],
  "Nissan": ["Qashqai", "Juke", "X-Trail", "Micra", "Leaf"],
  "Opel": ["Corsa", "Astra", "Insignia", "Mokka", "Crossland", "Grandland"],
  "Peugeot": ["208", "308", "3008", "2008", "5008"],
  "Polestar": ["Polestar 2", "Polestar 3"],
  "Porsche": ["911", "Cayenne", "Macan", "Panamera", "Taycan"],
  "Renault": ["Clio", "Megane", "Captur", "Kadjar", "Austral", "Zoe"],
  "Rolls-Royce": ["Ghost", "Phantom", "Cullinan", "Wraith"],
  "Saab": ["9-3", "9-5"],
  "Seat": ["Leon", "Ibiza", "Ateca", "Arona", "Tarraco"],
  "Skoda": ["Octavia", "Fabia", "Superb", "Kodiaq", "Karoq", "Scala"],
  "Smart": ["Fortwo", "Forfour", "#1"],
  "Subaru": ["Impreza", "Forester", "Outback", "XV"],
  "Suzuki": ["Swift", "Vitara", "SX4", "Jimny", "Ignis"],
  "Tesla": ["Model 3", "Model Y", "Model S", "Model X"],
  "Toyota": ["Corolla", "Yaris", "RAV4", "C-HR", "Camry", "Aygo"],
  "Volkswagen": ["Golf", "Passat", "Tiguan", "Polo", "Touran", "Touareg"],
  "Volvo": ["XC40", "XC60", "XC90", "V60", "S60"],
  "VW": ["Golf", "Passat", "Tiguan", "Polo", "Touran", "Touareg"],
};

const buildModelPlaceholder = (make: string) => {
  const models = popularModelsByMake[make] ?? [];
  if (models.length >= 3) {
    return `z.B. ${models[0]}, ${models[1]}, ${models[2]}`;
  }
  if (models.length === 2) {
    return `z.B. ${models[0]}, ${models[1]}`;
  }
  if (models.length === 1) {
    return `z.B. ${models[0]}`;
  }
  return "z.B. A4, Golf, 3er";
};

const stepInstructions: Record<string, { title: string; text: string }> = {
  make: {
    title: "Marke auswählen",
    text: "Wählen Sie die Marke Ihres Fahrzeugs. Weitere Marken finden Sie in der erweiterten Liste.",
  },
  bodyType: {
    title: "Karosserieform",
    text: "Wählen Sie den Fahrzeugtyp Ihres Autos an, welches Sie verkaufen wollen.",
  },
  powertrain: {
    title: "Motorisierung",
    text: "Wählen Sie die passende Motorisierung und geben Sie die PS an.",
  },
  model: {
    title: "Modell eingeben",
    text: "Geben Sie das genaue Modell an oder wählen Sie einen Vorschlag aus.",
  },
  firstRegistration: {
    title: "Erstzulassung erfassen",
    text: "Monat und Jahr der Erstzulassung auswählen. Kein Datum in der Zukunft.",
  },
  mileage: {
    title: "Kilometerstand angeben",
    text: "Nutzen Sie den Slider oder tragen Sie den exakten Stand ein.",
  },
  owners: {
    title: "Halteranzahl",
    text: "Wie viele Halter hatte das Fahrzeug bisher?",
  },
  service: {
    title: "Service & HU",
    text: "Letzter Service, Scheckheft-Status und nächster HU-Termin.",
  },
  color: {
    title: "Fahrzeugfarbe",
    text: "Wählen Sie die Außenfarbe Ihres Fahrzeugs.",
  },
  transmissionDrive: {
    title: "Getriebe & Antrieb",
    text: "Getriebeart und Antriebsart Ihres Fahrzeugs auswählen.",
  },
  equipment: {
    title: "Ausstattung",
    text: "Wählen Sie die vorhandene Ausstattung Ihres Fahrzeugs aus.",
  },
  generalCondition: {
    title: "Allgemeiner Zustand",
    text: "Wie würden Sie den Gesamtzustand Ihres Fahrzeugs einschätzen?",
  },
  condition: {
    title: "Fahrzeugzustand",
    text: "Raucherfahrzeug und Unfallfreiheit angeben. Bei Unfall bitte Details erganzen.",
  },
  vin: {
    title: "VIN erfassen",
    text: "17-stellige Fahrgestellnummer eingeben, um Ausstattung sicher zuzuordnen.",
  },
  photos: {
    title: "Fotos hochladen (optional)",
    text: "Bis zu 10 Bilder helfen uns bei der schnellen Bewertung.",
  },
  titleSlide: {
    title: "Start",
    text: "Vor dem Start: Fahrgestellnummer bereithalten. Optional: Fahrzeug für Inzahlungnahme auswählen.",
  },
  interest: {
    title: "Interessensnummer",
    text: "Bitte die Nummer des Fahrzeugs eingeben, an dem Sie interessiert sind (Inzahlungnahme).",
  },
  priceExpectation: {
    title: "realistische Preisvorstellung",
    text: "Bitte nennen Sie Ihre realistische Preisvorstellung für Ihr Fahrzeug.",
  },
  contact: {
    title: "Kontaktdaten",
    text: "Damit wir uns schnell melden können, bitte Kontaktdaten hinterlegen.",
  },
};

type FormData = {
  make: string;
  model: string;
  trimLine: string; // z.B. M Sport, AMG Line, S Line – optional
  bodyType: string;
  fuelType: string;
  power: number | null;
  firstRegistrationMonth: string;
  firstRegistrationYear: string;
  mileage: number | null;
  ownersCount: number | null;
  serviceBook: boolean | null;
  lastServiceMonth: string;
  lastServiceYear: string;
  huMonth: string;
  huYear: string;
  huExpired: boolean;
  exteriorColor: string;
  transmission: string;
  driveType: string;
  equipment: string[];
  generalCondition: string;
  smoker: boolean | null;
  accident: boolean | null;
  accidentRepaired: boolean | null;
  accidentDescription: string;
  accidentAmount: string;
  vin: string;
  priceExpectation: string;
  interestNumber: string;
  contactFirstName: string;
  contactLastName: string;
  contactPhone: string;
  contactEmail: string;
  contactPlz: string;
  contactCity: string;
  /** Optionale Nachricht (z. B. Hinweise, Wünsche) – nur in Kontakt-Slide */
  contactMessage: string;
  /** Pflicht: Datenschutz zur Kenntnis genommen + Kontakt mit Bewertung (E-Mail/Anruf) */
  contactPrivacyConsent: boolean;
};

/** Anzahl der Wizard-Schritte (Indices 0 … n-1) – für Entwurf wiederherstellen */
const VEHICLE_PURCHASE_STEP_COUNT = 17;

const clampPurchaseStep = (step: number) =>
  Math.max(0, Math.min(Math.floor(step), VEHICLE_PURCHASE_STEP_COUNT - 1));

const interestDigitsFromProp = (initialInterest: string) => {
  const digits = (initialInterest || "").replace(/\D/g, "").slice(0, 3);
  return digits ? digits.padStart(3, "0") : "";
};

const createInitialFormData = (initialInterest: string): FormData => ({
  make: "",
  model: "",
  trimLine: "",
  bodyType: "",
  fuelType: "",
  power: null,
  firstRegistrationMonth: "",
  firstRegistrationYear: "",
  mileage: null,
  ownersCount: null,
  serviceBook: null,
  lastServiceMonth: "",
  lastServiceYear: "",
  huMonth: "",
  huYear: "",
  huExpired: false,
  exteriorColor: "",
  transmission: "",
  driveType: "",
  equipment: [],
  generalCondition: "",
  smoker: null,
  accident: null,
  accidentRepaired: null,
  accidentDescription: "",
  accidentAmount: "",
  vin: "",
  priceExpectation: "",
  interestNumber: interestDigitsFromProp(initialInterest),
  contactFirstName: "",
  contactLastName: "",
  contactPhone: "",
  contactEmail: "",
  contactPlz: "",
  contactCity: "",
  contactMessage: "",
  contactPrivacyConsent: false,
});

function mergeFormDataFromDraft(base: FormData, raw: Record<string, unknown>): FormData {
  const o = raw as Partial<FormData>;
  const merged: FormData = { ...base, ...o };
  if (!Array.isArray(merged.equipment)) merged.equipment = base.equipment;
  return merged;
}

/** Wenn die URL eine Kennnummer hat, aber der Entwurf keine – URL setzen */
function mergeInterestFromUrl(formData: FormData, initialInterest: string): FormData {
  const fromUrl = interestDigitsFromProp(initialInterest);
  if (!fromUrl) return formData;
  const fromDraft = formData.interestNumber.replace(/\D/g, "");
  if (fromDraft.length === 3) return formData;
  return { ...formData, interestNumber: fromUrl };
}

type Labels = {
  title: string;
  subtitle: string;
  next: string;
  back: string;
  submit: string;
  start?: string;
};

type VehiclePurchaseFormProps = {
  containerId?: string;
  formId?: string;
  topBrands?: string[];
  labels?: Partial<Labels>;
  onSubmit?: (data: FormData) => void;
  /** 3-stellige Kennnummer für Inzahlungnahme (z. B. aus Detailansicht) */
  initialInterestNumber?: string;
};

const defaultLabels: Labels = {
  title: "Fahrzeugankauf mit aktueller Marktbewertung",
  subtitle: "Geführt, klar und ohne Umwege. Nur relevante Fragen je Schritt.",
  next: "Weiter",
  back: "Zurück",
  submit: "Anfrage absenden",
  start: "Starten",
};

/** Marken-spezifische Ausstattungslinien – nur relevante Vorschläge pro Hersteller */
const TRIM_LINES_BY_MAKE: Record<string, string[]> = {
  BMW: ["M Sport", "M Performance", "M Package", "Luxury Line", "Sport Line", "Individual"],
  Mercedes: ["AMG Line", "AMG", "AMG Sport", "Elegance", "Avantgarde", "Exclusive"],
  Audi: ["S Line", "S", "RS", "Sport", "Design", "Black Edition"],
  Volkswagen: ["R-Line", "R", "GTI", "GTD", "GTE", "Highline", "Comfortline", "Trendline"],
  "Mercedes-Benz": ["AMG Line", "AMG", "AMG Sport", "Elegance", "Avantgarde", "Exclusive"],
  Opel: ["GSI", "OPC", "Line", "Elegance", "Sport"],
  Ford: ["ST-Line", "ST", "RS", "Titanium", "Trend", "Vignale"],
  Skoda: ["Sportline", "Style", "Ambition", "Active"],
  Seat: ["FR", "FR Sport", "Xcellence", "Style"],
  Hyundai: ["N-Line", "N", "Premium", "Business"],
  Kia: ["GT-Line", "GT", "Premium", "Sport"],
  Mazda: ["Sport", "Homura", "Exclusive", "Centenary"],
  Toyota: ["GR Sport", "GR", "Style", "Advance"],
  Honda: ["Sport", "Elegance", "Executive"],
  Nissan: ["N-Connecta", "Tekna", "Acenta", "Visia"],
  Peugeot: ["GT Line", "GT", "Allure", "Active"],
  Renault: ["R.S. Line", "GT", "Zen", "Intens"],
  Volvo: ["R-Design", "Inscription", "Momentum"],
  Porsche: ["Sport Chrono", "Sport Design", "Exclusive"],
  Mini: ["Cooper S", "John Cooper Works", "Sport", "Exclusive"],
};

const formatNumber = (value: number) =>
  new Intl.NumberFormat("de-DE").format(value);

/** Formatiert Ziffern mit Tausendertrennzeichen (Punkt im deutschen Format), z.B. 1200 -> "1.200" */
const formatPriceWithDots = (digits: string): string => {
  const d = digits.replace(/\D/g, "");
  if (!d) return "";
  return d.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const getTotalUploadSizeMb = (photoFiles: File[], accidentFiles: File[]) =>
  (photoFiles.reduce((sum, file) => sum + file.size, 0) +
    accidentFiles.reduce((sum, file) => sum + file.size, 0)) /
  (1024 * 1024);

const maxUploadBytesPerFile = maxPhotoSizeMb * 1024 * 1024;

/** Alle Limits: pro Datei + Summe (z. B. auch nach Entwurf aus IndexedDB). */
const areUploadsValid = (photoFiles: File[], accidentFiles: File[]) => {
  if (photoFiles.some((f) => f.size > maxUploadBytesPerFile)) return false;
  if (accidentFiles.some((f) => f.size > maxUploadBytesPerFile)) return false;
  return getTotalUploadSizeMb(photoFiles, accidentFiles) <= maxTotalUploadSizeMb;
};

/** Konkrete Hinweise für die Upload-Slides (sichtbar + blockiert „Weiter“). */
const getUploadValidationMessages = (photoFiles: File[], accidentFiles: File[]): string[] => {
  const issues: string[] = [];
  for (const f of photoFiles) {
    if (f.size > maxUploadBytesPerFile) {
      issues.push(`„${f.name}“: mehr als ${maxPhotoSizeMb} MB (Fahrzeugfotos).`);
    }
  }
  for (const f of accidentFiles) {
    if (f.size > maxUploadBytesPerFile) {
      issues.push(`„${f.name}“: mehr als ${maxPhotoSizeMb} MB (Unfall/Dokumente).`);
    }
  }
  const total = getTotalUploadSizeMb(photoFiles, accidentFiles);
  if (total > maxTotalUploadSizeMb) {
    issues.push(
      `Alle Dateien zusammen ca. ${total.toFixed(1)} MB – maximal ${maxTotalUploadSizeMb} MB erlaubt.`,
    );
  }
  return issues;
};

const UploadLimitsCallout = ({
  photoFiles,
  accidentFiles,
}: {
  photoFiles: File[];
  accidentFiles: File[];
}) => {
  const messages = getUploadValidationMessages(photoFiles, accidentFiles);
  if (!messages.length) return null;
  return (
    <div
      role="alert"
      className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-sm"
    >
      <p className="font-semibold text-destructive">Upload-Vorgaben nicht erfüllt</p>
      <p className="mt-1 text-muted-foreground">
        Bitte anpassen – erst dann ist <span className="font-medium text-foreground">Weiter</span> möglich
        (max. {maxPhotoSizeMb} MB pro Datei, max. {maxTotalUploadSizeMb} MB für alle Dateien zusammen).
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-destructive">
        {messages.map((msg, i) => (
          <li key={`${i}-${msg}`}>{msg}</li>
        ))}
      </ul>
    </div>
  );
};

const toNumberInput = (value: string) => {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits) : null;
};

const isValidMonthYear = (month: string, year: string) =>
  Boolean(month) && Boolean(year);

const isMonthYearInFuture = (month: string, year: string) => {
  if (!month || !year) return false;
  const yearNumber = Number(year);
  const monthNumber = Number(month);
  if (Number.isNaN(yearNumber) || Number.isNaN(monthNumber)) return false;
  if (yearNumber > currentYear) return true;
  if (yearNumber === currentYear && monthNumber > currentMonth) return true;
  return false;
};

const isMonthYearInPast = (month: string, year: string) => {
  if (!month || !year) return false;
  const yearNumber = Number(year);
  const monthNumber = Number(month);
  if (Number.isNaN(yearNumber) || Number.isNaN(monthNumber)) return false;
  if (yearNumber < currentYear) return true;
  if (yearNumber === currentYear && monthNumber < currentMonth) return true;
  return false;
};

const isMonthYearBeyondHuLimit = (month: string, year: string) => {
  if (!month || !year) return false;
  const yearNumber = Number(year);
  const monthNumber = Number(month);
  if (Number.isNaN(yearNumber) || Number.isNaN(monthNumber)) return false;
  if (yearNumber > currentYear + 2) return true;
  if (yearNumber === currentYear + 2 && monthNumber > currentMonth) return true;
  return false;
};

const VehiclePurchaseForm = ({
  containerId = "vehicle-purchase-form",
  formId = "vehicleForm",
  topBrands = defaultTopBrands,
  labels,
  onSubmit,
  initialInterestNumber: initialInterest = "",
}: VehiclePurchaseFormProps) => {
  const mergedLabels = { ...defaultLabels, ...labels };
  /** Einmal pro Mount: gespeicherter Entwurf (sessionStorage, nur aktueller Tab) */
  const bootDraft = useMemo(
    () => loadDraftForVehicleInterestFromUrl(initialInterest),
    [initialInterest],
  );
  const [currentStep, setCurrentStep] = useState(() =>
    bootDraft ? clampPurchaseStep(bootDraft.currentStep) : 0,
  );
  const isInitialMount = useRef(true);
  const [mileageInput, setMileageInput] = useState(() => bootDraft?.mileageInput ?? "");
  const [mileageFocus, setMileageFocus] = useState(false);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoError, setPhotoError] = useState("");
  const [accidentFiles, setAccidentFiles] = useState<File[]>([]);
  const [accidentError, setAccidentError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [plzLookup, setPlzLookup] = useState<"idle" | "loading" | { city: string } | "not_found">("idle");
  const plzLookupAbortRef = useRef<AbortController | null>(null);
  const navigate = useNavigate();
  /** Nach erfolgreichem Absenden: keinen Entwurf mehr speichern (Unmount-Cleanup würde sonst die letzte Slide wieder in sessionStorage schreiben). */
  const skipDraftPersistenceRef = useRef(false);
  /** true, sobald gespeicherte Dateien aus IndexedDB geladen sind – verhindert Überschreiben beim ersten Speichern */
  const [draftFilesHydrated, setDraftFilesHydrated] = useState(false);

  const [formData, setFormData] = useState<FormData>(() =>
    bootDraft
      ? mergeInterestFromUrl(
          mergeFormDataFromDraft(createInitialFormData(initialInterest), bootDraft.formData),
          initialInterest,
        )
      : createInitialFormData(initialInterest),
  );

  const { data: vehicles = [] } = useVehicles();
  const {
    data: brands = [],
    isLoading: brandsLoading,
    isError: brandsError,
  } = useBrands();
  const normalizedMake = formData.make === "VW" ? "Volkswagen" : formData.make;
  const {
    data: models = [],
    isLoading: modelsLoading,
    isError: modelsError,
  } = useModels(normalizedMake);

  const normalizeBrand = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

  const brandOptions = useMemo(() => {
    const allowedMap = new Map<string, string>();
    allowedBrands.forEach((brand) => {
      allowedMap.set(normalizeBrand(brand), brand);
    });

    const unique = new Set<string>();
    brands.forEach((brand) => {
      const clean = brand?.trim();
      if (!clean) return;
      const key = normalizeBrand(clean);
      if (!allowedMap.has(key)) return;
      unique.add(allowedMap.get(key) ?? clean);
    });

    allowedBrands.forEach((brand) => {
      unique.add(brand);
    });

    const list = Array.from(unique);
    list.sort((a, b) => a.localeCompare(b));
    return list;
  }, [brands]);

  const filteredModels = useMemo(() => {
    const term = formData.model.trim().toLowerCase();
    const fallback = popularModelsByMake[normalizedMake] ?? [];

    if (!term) {
      return fallback.length ? fallback : models.slice(0, 12);
    }

    const source = models.length ? models : fallback;
    return source
      .filter((model) => model.toLowerCase().includes(term))
      .slice(0, 12);
  }, [formData.model, models, normalizedMake]);

  const topBrandList = useMemo(() => {
    const allowedSet = new Set(brandOptions.map((brand) => normalizeBrand(brand)));
    return topBrands.filter((brand) => allowedSet.has(normalizeBrand(brand)));
  }, [brandOptions, topBrands]);

  const interestNumber = formData.interestNumber.replace(/\D/g, "").slice(0, 3);
  const interestVehicle = useMemo(() => {
    if (interestNumber.length !== 3) return undefined;
    return vehicles.find(
      (vehicle) =>
        vehicle.internalNumber &&
        vehicle.internalNumber.padStart(3, "0") === interestNumber,
    );
  }, [vehicles, interestNumber]);

  useEffect(() => {
    if (mileageFocus) return;
    setMileageInput(formData.mileage ? formatNumber(formData.mileage) : "");
  }, [formData.mileage, mileageFocus]);

  const plzDigits = formData.contactPlz.replace(/\D/g, "");
  useEffect(() => {
    if (plzDigits.length !== 5) {
      setPlzLookup("idle");
      setFormData((prev) => (prev.contactCity ? { ...prev, contactCity: "" } : prev));
      return;
    }
    const plz = plzDigits;
    if (plzLookupAbortRef.current) plzLookupAbortRef.current.abort();
    plzLookupAbortRef.current = new AbortController();
    setPlzLookup("loading");
    fetch(`https://api.zippopotam.us/de/${plz}`, { signal: plzLookupAbortRef.current.signal })
      .then((res) => {
        if (!res.ok) throw new Error("not_found");
        return res.json();
      })
      .then((data: { places?: Array<{ "place name": string }> }) => {
        const city = data.places?.[0]?.["place name"];
        if (city) {
          setPlzLookup({ city });
          setFormData((prev) => ({ ...prev, contactCity: city }));
        } else {
          setPlzLookup("not_found");
          setFormData((prev) => ({ ...prev, contactCity: "" }));
        }
      })
      .catch(() => {
        setPlzLookup("not_found");
        setFormData((prev) => (prev.contactCity ? { ...prev, contactCity: "" } : prev));
      });
    return () => {
      plzLookupAbortRef.current?.abort();
    };
  }, [plzDigits]);

  /** Immer aktuell für Unmount / visibility (SPA-Navigation triggert kein zuverlässiges pagehide mit alter Closure) */
  const draftStateRef = useRef({
    formData,
    currentStep,
    mileageInput,
    photoFiles,
    accidentFiles,
    draftFilesHydrated,
  });

  useEffect(() => {
    let cancelled = false;
    loadDraftFiles()
      .then(({ photos, accidents }) => {
        if (cancelled) return;
        if (photos.length) setPhotoFiles(photos);
        if (accidents.length) setAccidentFiles(accidents);
      })
      .finally(() => {
        if (!cancelled) setDraftFilesHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /** Ref für Unmount / visibility – immer vollständig */
  useLayoutEffect(() => {
    draftStateRef.current = {
      formData,
      currentStep,
      mileageInput,
      photoFiles,
      accidentFiles,
      draftFilesHydrated,
    };
  }, [formData, currentStep, mileageInput, photoFiles, accidentFiles, draftFilesHydrated]);

  /**
   * Entwurf synchron vor Paint (sessionStorage, nur aktueller Tab).
   * useLayoutEffect: letzte Eingabe bleibt beim Seitenwechsel im selben Tab erhalten.
   */
  useLayoutEffect(() => {
    if (skipDraftPersistenceRef.current) return;
    saveDraftToSession({
      v: 1,
      formData: formData as unknown as Record<string, unknown>,
      currentStep,
      mileageInput,
    });
  }, [formData, currentStep, mileageInput]);

  const fileSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!draftFilesHydrated || skipDraftPersistenceRef.current) return;
    if (fileSaveTimerRef.current) clearTimeout(fileSaveTimerRef.current);
    fileSaveTimerRef.current = setTimeout(() => {
      fileSaveTimerRef.current = null;
      if (skipDraftPersistenceRef.current) return;
      void saveDraftFiles(photoFiles, accidentFiles);
    }, 400);
    return () => {
      if (fileSaveTimerRef.current) clearTimeout(fileSaveTimerRef.current);
    };
  }, [photoFiles, accidentFiles, draftFilesHydrated]);

  /** Beim Verlassen der Seite / Tab: letzten Stand sichern (wichtig für Client-Routing) */
  useEffect(() => {
    const flushAll = () => {
      if (skipDraftPersistenceRef.current) return;
      const s = draftStateRef.current;
      saveDraftToSession({
        v: 1,
        formData: s.formData as unknown as Record<string, unknown>,
        currentStep: s.currentStep,
        mileageInput: s.mileageInput,
      });
      if (s.draftFilesHydrated) {
        void saveDraftFiles(s.photoFiles, s.accidentFiles);
      }
    };
    const onVis = () => {
      if (document.visibilityState === "hidden") flushAll();
    };
    window.addEventListener("pagehide", flushAll);
    window.addEventListener("beforeunload", flushAll);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      flushAll();
      window.removeEventListener("pagehide", flushAll);
      window.removeEventListener("beforeunload", flushAll);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const clearPhotos = () => {
    setPhotoFiles([]);
    setPhotoError("");
  };

  const clearAccidentFiles = () => {
    setAccidentFiles([]);
    setAccidentError("");
  };

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const updateMileage = (value: number | null) => {
    if (value === null) {
      updateField("mileage", null);
      setMileageInput("");
      return;
    }

    const bounded = Math.min(Math.max(value, minMileage), maxMileage);
    updateField("mileage", bounded);
    setMileageInput(formatNumber(bounded));
  };

  const processFilesAsync = (
    files: FileList | File[],
    onDone: (accepted: File[], rejected: string[]) => void,
  ) => {
    const incoming = Array.from(files);
    const maxBytes = maxPhotoSizeMb * 1024 * 1024;

    const processOne = (i: number, accepted: File[], rejected: string[]) => {
      if (i >= incoming.length) {
        onDone(accepted, rejected);
        return;
      }
      const file = incoming[i];
      const type = file.type;
      const size = file.size;
      const name = file.name;

      if (!type.startsWith("image/") && type !== "application/pdf") {
        rejected.push(`${name}: ungültiger Dateityp`);
      } else if (size > maxBytes) {
        rejected.push(`${name}: größer als ${maxPhotoSizeMb} MB`);
      } else {
        accepted.push(file);
      }

      if (i + 1 < incoming.length) {
        queueMicrotask(() => processOne(i + 1, accepted, rejected));
      } else {
        onDone(accepted, rejected);
      }
    };

    queueMicrotask(() => processOne(0, [], []));
  };

  const handlePhotoFiles = (files: FileList | File[]) => {
    if (!files?.length) return;
    processFilesAsync(files, (accepted, rejected) => {
      setPhotoFiles((prev) => {
        const combined = [...prev, ...accepted];
        if (combined.length > maxPhotoFiles) {
          rejected.push(`Maximal ${maxPhotoFiles} Dateien`);
        }
        const trimmed = combined.slice(0, maxPhotoFiles);
        const totalMb = getTotalUploadSizeMb(trimmed, accidentFiles);
        if (totalMb > maxTotalUploadSizeMb) {
          rejected.push(`Gesamtgröße zu hoch (max. ${maxTotalUploadSizeMb} MB)`);
          return prev;
        }
        return trimmed;
      });
      setPhotoError(rejected.length ? rejected.join(" | ") : "");
    });
  };

  const handleAccidentFiles = (files: FileList | File[]) => {
    if (!files?.length) return;
    processFilesAsync(files, (accepted, rejected) => {
      setAccidentFiles((prev) => {
        const combined = [...prev, ...accepted];
        if (combined.length > maxPhotoFiles) {
          rejected.push(`Maximal ${maxPhotoFiles} Dateien`);
        }
        const trimmed = combined.slice(0, maxPhotoFiles);
        const totalMb = getTotalUploadSizeMb(photoFiles, trimmed);
        if (totalMb > maxTotalUploadSizeMb) {
          rejected.push(`Gesamtgröße zu hoch (max. ${maxTotalUploadSizeMb} MB)`);
          return prev;
        }
        return trimmed;
      });
      setAccidentError(rejected.length ? rejected.join(" | ") : "");
    });
  };

  const updateOwners = (delta: number) => {
    const current = formData.ownersCount ?? 0;
    const next = Math.min(Math.max(current + delta, 0), maxOwners);
    updateField("ownersCount", next);
  };

  const isFirstRegistrationValid = () => {
    if (!isValidMonthYear(formData.firstRegistrationMonth, formData.firstRegistrationYear)) {
      return false;
    }
    const yearNumber = Number(formData.firstRegistrationYear);
    if (Number.isNaN(yearNumber) || yearNumber < minYear) return false;
    if (isMonthYearInFuture(formData.firstRegistrationMonth, formData.firstRegistrationYear)) {
      return false;
    }
    return true;
  };

  const isMileageValid = () => {
    if (formData.mileage === null) return false;
    return formData.mileage >= minMileage && formData.mileage <= maxMileage;
  };

  const isOwnersValid = () => {
    if (formData.ownersCount === null) return false;
    return formData.ownersCount >= 0 && formData.ownersCount <= maxOwners;
  };

  const isServiceValid = () => {
    if (formData.serviceBook === null) return false;
    if (!formData.serviceBook) return true;
    if (!isValidMonthYear(formData.lastServiceMonth, formData.lastServiceYear)) return false;
    return !isMonthYearInFuture(formData.lastServiceMonth, formData.lastServiceYear);
  };

  const isHuValid = () => {
    if (formData.huExpired) return true;
    if (!isValidMonthYear(formData.huMonth, formData.huYear)) return false;
    if (isMonthYearInPast(formData.huMonth, formData.huYear)) return false;
    if (isMonthYearBeyondHuLimit(formData.huMonth, formData.huYear)) return false;
    return true;
  };

  const isAccidentValid = () => {
    if (formData.smoker === null || formData.accident === null) return false;
    if (!formData.accident) return true;
    if (formData.accidentRepaired === null) return false;
    return true;
  };

  const isVinValid = () => {
    const normalized = formData.vin.trim().toUpperCase();
    if (normalized.length !== 17) return false;
    return /^[A-HJ-NPR-Z0-9]{17}$/.test(normalized);
  };

  const isInterestValid = () => interestNumber.length === 3 && Boolean(interestVehicle);

  const isContactValid = () => {
    const email = formData.contactEmail.trim();
    const phoneDigits = formData.contactPhone.replace(/\D/g, "");
    const plzDigits = formData.contactPlz.replace(/\D/g, "");
    if (!formData.contactFirstName.trim()) return false;
    if (!formData.contactLastName.trim()) return false;
    if (!email.includes("@")) return false;
    if (phoneDigits.length < 6) return false;
    if (plzDigits.length !== 5) return false;
    if (!formData.contactPrivacyConsent) return false;
    return true;
  };

  const steps = useMemo(
    () => [
      {
        id: "titleSlide",
        title: "Bereit zum Start",
        isValid: () => interestNumber.length === 3 && Boolean(interestVehicle),
        render: () => (
          <div className="py-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
              <div className="rounded-2xl border border-border bg-white/70 p-6 text-left shadow-sm">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                  <Info className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">
                  Fahrgestellnummer bereithalten
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Bitte halten Sie die 17-stellige Fahrgestellnummer Ihres Fahrzeugs bereit.
                  Wir benötigen sie für Ausstattung und Historie – wichtig für eine faire Preisbestimmung.
                </p>
                <div className="mt-5 rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">
                  Tipp: Die Nummer finden Sie im Fahrzeugschein unter <span className="font-medium text-foreground">E</span>.
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                <h4 className="text-sm font-semibold text-foreground mb-1">
                  Fahrzeug für Inzahlungnahme auswählen
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Geben Sie die 3-stellige Kennnummer des gewünschten Fahrzeugs ein – Sie finden sie in unserer Fahrzeugsuche.
                </p>
                <Input
                  value={interestNumber}
                  onChange={(event) => updateField("interestNumber", event.target.value)}
                  placeholder="3-stellige Kennnr."
                  inputMode="numeric"
                  className="text-center h-12"
                  maxLength={3}
                />
                {interestNumber.length === 3 && !interestVehicle && (
                  <p className="mt-2 text-xs text-destructive text-center">Nicht gefunden</p>
                )}
                {!interestVehicle && (
                  <div className="mt-4 text-center">
                    <p className="text-sm text-muted-foreground mb-3">
                      Noch kein Fahrzeug im Blick?
                    </p>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/fahrzeuge" className="inline-flex items-center gap-2">
                        <Search className="h-4 w-4" />
                        Fahrzeuge durchsuchen
                      </Link>
                    </Button>
                  </div>
                )}
                {interestVehicle && (
                  <div className="mt-5 rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                    <div className="relative aspect-[16/9] w-full bg-muted">
                      <img
                        src={getVehicleImageWithFallback(
                          interestVehicle.image,
                          interestVehicle.id,
                        )}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-4 text-center">
                      <VehicleTitle
                        brand={interestVehicle.brand}
                        model={interestVehicle.model}
                        productionSeries={interestVehicle.productionSeries}
                        modelVariant={interestVehicle.modelVariant}
                        className="text-lg font-semibold text-foreground"
                        as="h4"
                      />
                      <div className="flex flex-wrap justify-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>{interestVehicle.year}</span>
                        <span>·</span>
                        <span>{formatNumber(interestVehicle.mileage)} km</span>
                        <span>·</span>
                        <span>{interestVehicle.fuel}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "make",
        title: "Marke / Hersteller",
        isValid: () => Boolean(formData.make.trim()) && formData.model.trim().length >= minModelLength,
        render: () => (
          <div className="space-y-6">
            {brandsError ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  Marken könnten nicht geladen werden. Bitte manuell eingeben.
                </div>
                <p className="mt-3 text-lg font-bold text-foreground">Marke</p>
                <Input
                  value={formData.make}
                  onChange={(event) => updateField("make", event.target.value)}
                  placeholder="z.B. BMW"
                  className="mt-3"
                />
              </div>
            ) : brandsLoading ? (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Marken werden geladen ...
              </div>
            ) : brandOptions.length === 0 ? (
              <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground mb-2">Keine Marken gefunden</p>
                <p className="text-lg font-bold text-foreground">Marke</p>
                <Input
                  value={formData.make}
                  onChange={(event) => updateField("make", event.target.value)}
                  placeholder="Marke manuell eingeben"
                />
              </div>
            ) : (
              <div>
                <p className="text-lg font-bold text-foreground">Marke</p>
                <Select value={formData.make} onValueChange={(v) => updateField("make", v)}>
                  <SelectTrigger className="mt-2 h-11">
                    <SelectValue placeholder="Marke auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {topBrandList.length > 0 && (
                      <SelectGroup>
                        <SelectLabel>Beliebte Marken</SelectLabel>
                        {topBrandList.map((brand) => (
                          <SelectItem key={`top-${brand}`} value={brand}>
                            {brand}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                    <SelectGroup>
                      <SelectLabel>Alle Marken (A-Z)</SelectLabel>
                      {brandOptions
                        .filter((brand) => !topBrandList.includes(brand))
                        .map((brand) => (
                          <SelectItem key={`all-${brand}`} value={brand}>
                            {brand}
                          </SelectItem>
                        ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-lg font-bold text-foreground">Modell</label>
                <Input
                  value={formData.model}
                  onChange={(event) => updateField("model", event.target.value)}
                  placeholder={buildModelPlaceholder(normalizedMake)}
                  className="mt-2"
                />
                {modelsLoading && (
                  <p className="mt-2 text-xs text-muted-foreground">Modelle werden geladen ...</p>
                )}
                {modelsError && (
                  <p className="mt-2 text-xs text-destructive">
                    Modelle könnten nicht geladen werden.
                  </p>
                )}
              </div>
              {!modelsLoading && !modelsError && filteredModels.length > 0 && (
                <div className="rounded-xl border border-border bg-muted/40 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">
                    Vorschläge
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {filteredModels.map((model) => (
                      <button
                        key={model}
                        type="button"
                        onClick={() => updateField("model", model)}
                        className={`rounded-full border px-4 py-2 text-lg font-bold transition-colors ${
                          formData.model === model
                            ? "border-primary bg-primary text-white"
                            : "border-border bg-background text-foreground hover:border-primary"
                        }`}
                      >
                        {model}
                      </button>
                    ))}
                  </div>
                </div>
              )}

            <div>
              <label className="text-lg font-bold text-foreground">Ausstattungslinie (optional)</label>
              <p className="mt-1 text-sm text-muted-foreground">
                Zusätzliche Info zur besonderen Ausstattungslinie. Vorschläge abhängig von der Marke, oder manuell eingeben.
              </p>
              {(() => {
                const trimOptions = (normalizedMake && TRIM_LINES_BY_MAKE[normalizedMake]) || [];
                const selectValue = formData.trimLine === "" ? "__none__" : (trimOptions.includes(formData.trimLine) ? formData.trimLine : "__none__");
                return (
                  <>
                    <Select
                      value={selectValue}
                      onValueChange={(v) => updateField("trimLine", v === "__none__" ? "" : v)}
                    >
                      <SelectTrigger className="mt-2 h-11">
                        <SelectValue placeholder="Vorschlag wählen (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Keine / nicht angegeben</SelectItem>
                        {trimOptions.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={formData.trimLine}
                      onChange={(e) => updateField("trimLine", e.target.value)}
                      placeholder="oder manuell eingeben (z.B. M Performance, Edition …)"
                      className="mt-2"
                    />
                  </>
                );
              })()}
            </div>
            </div>
          </div>
        ),
      },
      {
        id: "bodyType",
        title: "Karosserieform",
        isValid: () => Boolean(formData.bodyType.trim()),
        render: () => (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Bitte die passende Karosserieform auswählen.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {[
                { id: "Sportwagen", label: "Sportwagen", icon: <SportwagenIcon /> },
                { id: "Limousine", label: "Limousine", icon: <LimousineIcon /> },
                { id: "Kleinwagen", label: "Kleinwagen", icon: <KleinwagenIcon /> },
                { id: "Kombi", label: "Kombi", icon: <KombiIcon /> },
                { id: "Van", label: "Van/Minibus", icon: <VanIcon /> },
                { id: "Cabrio", label: "Cabriolet/Roadster", icon: <CabrioIcon /> },
                { id: "SUV", label: "SUV", icon: <SUVIcon /> },
              ].map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => updateField("bodyType", type.label)}
                  className={`group flex flex-col items-center justify-center gap-3 rounded-xl border px-4 py-5 text-center text-lg font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    formData.bodyType === type.label
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-background text-foreground hover:border-primary"
                  }`}
                >
                  <div
                    className={`h-10 w-10 md:h-12 md:w-12 ${
                      formData.bodyType === type.label ? "text-white" : "text-primary"
                    }`}
                  >
                    {type.icon}
                  </div>
                  <span>{type.label}</span>
                </button>
              ))}
            </div>
          </div>
        ),
      },
      {
        id: "powertrain",
        title: "Motorisierung",
        isValid: () => Boolean(formData.fuelType.trim()) && (formData.power ?? 0) > 0,
        render: () => (
          <div className="space-y-6">
            <div>
              <p className="text-lg font-bold text-foreground">Kraftstoffart</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {["Benzin", "Diesel", "Hybrid", "Elektro"].map((fuel) => (
                  <button
                    key={fuel}
                    type="button"
                    onClick={() => updateField("fuelType", fuel)}
                    className={`rounded-full border px-4 py-2 text-lg font-bold transition-colors ${
                      formData.fuelType === fuel
                        ? "border-primary bg-primary text-white"
                        : "border-border bg-background text-foreground hover:border-primary"
                    }`}
                  >
                    {fuel}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-lg font-bold text-foreground">PS angeben</label>
              <Input
                value={formData.power ?? ""}
                onChange={(event) => {
                  const digits = event.target.value.replace(/\D/g, "").slice(0, 3);
                  updateField("power", digits ? Number(digits) : null);
                }}
                placeholder="z.B. 150"
                inputMode="numeric"
                maxLength={3}
                className="mt-2"
              />
              <p className="mt-2 text-xs text-muted-foreground">Nur Zahlen eingeben.</p>
            </div>
          </div>
        ),
      },
      {
        id: "firstRegistration",
        title: "Erstzulassung",
        isValid: isFirstRegistrationValid,
        render: () => (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-lg font-bold text-foreground">Monat</label>
              <Select value={formData.firstRegistrationMonth} onValueChange={(v) => updateField("firstRegistrationMonth", v)}>
                <SelectTrigger className="mt-2 h-11">
                  <SelectValue placeholder="Monat auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month} value={month}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-lg font-bold text-foreground">Jahr</label>
              <Select value={formData.firstRegistrationYear} onValueChange={(v) => updateField("firstRegistrationYear", v)}>
                <SelectTrigger className="mt-2 h-11">
                  <SelectValue placeholder="Jahr auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-2 text-xs text-muted-foreground">Nicht in der Zukunft.</p>
            </div>
          </div>
        ),
      },
      {
        id: "mileage",
        title: "Kilometerstand",
        isValid: isMileageValid,
        render: () => (
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold text-foreground">Kilometerstand (Slider)</p>
                <span className="text-sm text-muted-foreground">
                  {formData.mileage !== null
                    ? `${formatNumber(formData.mileage)} km`
                    : "Bitte auswählen"}
                </span>
              </div>
              <Slider
                value={[formData.mileage ?? 0]}
                onValueChange={(value) => updateMileage(value[0])}
                min={minMileage}
                max={maxMileage}
                step={1000}
                className="mt-4"
              />
            </div>
            <div>
              <label className="text-lg font-bold text-foreground">Kilometerstand (genau)</label>
              <Input
                value={mileageFocus ? mileageInput : mileageInput ? `${mileageInput} km` : ""}
                onFocus={() => {
                  setMileageFocus(true);
                  setMileageInput(formData.mileage ? String(formData.mileage) : "");
                }}
                onBlur={() => {
                  setMileageFocus(false);
                  setMileageInput(formData.mileage ? formatNumber(formData.mileage) : "");
                }}
                onChange={(event) => {
                  const next = event.target.value.replace(/\D/g, "");
                  const rawNumber = next ? Number(next) : null;
                  const nextNumber =
                    rawNumber === null ? null : Math.min(rawNumber, maxMileage);
                  setMileageInput(nextNumber === null ? "" : String(nextNumber));
                  updateField("mileage", nextNumber);
                }}
                inputMode="numeric"
                min={minMileage}
                max={maxMileage}
                placeholder="120000"
                className="mt-2"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Bereich {formatNumber(minMileage)} - {formatNumber(maxMileage)} km
              </p>
            </div>
          </div>
        ),
      },
      {
        id: "owners",
        title: "Halteranzahl",
        isValid: isOwnersValid,
        render: () => (
          <div className="space-y-4">
            <p className="text-lg font-bold text-foreground">Anzahl der Halter</p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => updateOwners(-1)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background text-foreground hover:border-primary"
              >
                <Minus className="h-4 w-4" />
              </button>
              <div className="min-w-[80px] text-center text-3xl font-semibold text-foreground">
                {formData.ownersCount ?? "-"}
              </div>
              <button
                type="button"
                onClick={() => updateOwners(1)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background text-foreground hover:border-primary"
              >
                <Plus className="h-4 w-4" />
              </button>
              <span className="text-sm text-muted-foreground">Max. {maxOwners}</span>
            </div>
          </div>
        ),
      },
      {
        id: "service",
        title: "Service & HU",
        isValid: () => isServiceValid() && isHuValid(),
        render: () => (
          <div className="space-y-4">
            {/* Letzter Service – letzte 4 Jahre */}
            <div>
              <p className="text-lg font-bold text-foreground mb-3">Letzter Service</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Monat</label>
                  <Select value={formData.lastServiceMonth || "__none__"} onValueChange={(v) => updateField("lastServiceMonth", v === "__none__" ? "" : v)}>
                    <SelectTrigger className="mt-1 h-10">
                      <SelectValue placeholder="–" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">–</SelectItem>
                      {months.map((month) => (
                        <SelectItem key={month} value={month}>{month}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Jahr</label>
                  <Select value={formData.lastServiceYear || "__none__"} onValueChange={(v) => updateField("lastServiceYear", v === "__none__" ? "" : v)}>
                    <SelectTrigger className="mt-1 h-10">
                      <SelectValue placeholder="–" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">–</SelectItem>
                      {serviceYears.map((year) => (
                        <SelectItem key={year} value={year}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Scheckheft vollständig gepflegt */}
            <div>
              <p className="text-lg font-bold text-foreground mb-3">Scheckheft vollständig gepflegt?</p>
              <div className="flex gap-2">
                {[
                  { label: "Ja", value: true },
                  { label: "Nein", value: false },
                ].map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => updateField("serviceBook", option.value)}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                      formData.serviceBook === option.value
                        ? "border-primary bg-primary text-white"
                        : "border-border bg-background text-foreground hover:border-primary"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* HU */}
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-lg font-bold text-foreground">HU fällig</p>
                <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={formData.huExpired}
                    onChange={(event) => updateField("huExpired", event.target.checked)}
                    className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary"
                  />
                  Abgelaufen
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Monat</label>
                  <Select value={formData.huMonth || "__none__"} onValueChange={(v) => updateField("huMonth", v === "__none__" ? "" : v)} disabled={formData.huExpired}>
                    <SelectTrigger className="mt-1 h-9">
                      <SelectValue placeholder="–" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">–</SelectItem>
                      {months.map((month) => (
                        <SelectItem key={month} value={month}>{month}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Jahr</label>
                  <Select value={formData.huYear || "__none__"} onValueChange={(v) => updateField("huYear", v === "__none__" ? "" : v)} disabled={formData.huExpired}>
                    <SelectTrigger className="mt-1 h-9">
                      <SelectValue placeholder="–" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">–</SelectItem>
                      {huYears.map((year) => (
                        <SelectItem key={year} value={year}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "color",
        title: "Fahrzeugfarbe",
        isValid: () => Boolean(formData.exteriorColor?.trim()),
        render: () => (
          <div className="space-y-4">
            <p className="text-lg font-bold text-foreground mb-4">Außenfarbe wählen</p>
            <div className="flex flex-wrap gap-3">
              {BASIC_COLORS.map((colorName) => {
                const hex = getColorHex(colorName);
                const isSelected = formData.exteriorColor === colorName;
                return (
                  <button
                    key={colorName}
                    type="button"
                    onClick={() => updateField("exteriorColor", colorName)}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border-2 p-2 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                      isSelected ? "border-primary ring-2 ring-primary ring-offset-2" : "border-border bg-background hover:border-primary/50"
                    }`}
                    title={colorName}
                  >
                    <span
                      className="h-10 w-10 sm:h-12 sm:w-12 rounded-md shadow-inner border border-black/10"
                      style={{ backgroundColor: hex }}
                      aria-hidden
                    />
                    <span className="text-xs font-medium text-foreground">{colorName}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ),
      },
      {
        id: "transmissionDrive",
        title: "Getriebe & Antrieb",
        isValid: () => Boolean(formData.transmission?.trim() && formData.driveType?.trim()),
        render: () => (
          <div className="space-y-6">
            {/* Getriebe */}
            <div>
              <p className="text-lg font-bold text-foreground mb-3">Getriebe</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Automatikgetriebe", value: "Automatik" },
                  { label: "Schaltgetriebe", value: "Schaltgetriebe" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateField("transmission", option.value)}
                    className={`rounded-full border-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                      formData.transmission === option.value
                        ? "border-primary bg-primary text-white"
                        : "border-border bg-background text-foreground hover:border-primary/50"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Antrieb */}
            <div>
              <p className="text-lg font-bold text-foreground mb-3">Antrieb</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Allrad", value: "Allrad" },
                  { label: "Heckantrieb", value: "Heckantrieb" },
                  { label: "Vorderantrieb", value: "Vorderantrieb" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateField("driveType", option.value)}
                    className={`rounded-full border-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                      formData.driveType === option.value
                        ? "border-primary bg-primary text-white"
                        : "border-border bg-background text-foreground hover:border-primary/50"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "equipment",
        title: "Ausstattung",
        isValid: () => true,
        render: () => {
          const equipmentCategories = [
            {
              label: "Infotainment & Konnektivität",
              items: ["Apple CarPlay", "Android Auto", "Navi", "Bluetooth", "Freisprecheinrichtung", "USB-Anschluss", "Induktionsladen"],
            },
            {
              label: "Klima & Komfort",
              items: ["Klimaautomatik", "Sitzheizung", "Lenkradheizung", "Standheizung", "Sitzbelüftung"],
            },
            {
              label: "Sicherheit & Fahrassistenz",
              items: ["Einparkhilfe", "Rückfahrkamera", "360°-Kamera", "Totwinkelassistent", "ACC", "Tempomat", "Spurhalteassistent"],
            },
            {
              label: "Beleuchtung & Außen",
              items: ["LED-Scheinwerfer", "Matrix-LED", "AHK", "Dachgepäckträger"],
            },
            {
              label: "Innenausstattung",
              items: ["Leder", "Teilleder", "Sportsitze", "Panoramadach", "Schiebedach", "Head-up Display"],
            },
            {
              label: "Komfort & Zugang",
              items: ["Keyless Go", "Keyless Entry", "Elektrische Heckklappe", "Elektrische Sitze"],
            },
          ];
          const toggleEquipment = (item: string) => {
            const current = formData.equipment || [];
            if (current.includes(item)) {
              updateField("equipment", current.filter((e) => e !== item));
            } else {
              updateField("equipment", [...current, item]);
            }
          };
          return (
            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
              {equipmentCategories.map((category) => (
                <div key={category.label}>
                  <p className="text-lg font-bold text-foreground mb-3">{category.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {category.items.map((item) => {
                      const isSelected = formData.equipment?.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleEquipment(item)}
                          className={`rounded-full border-2 px-3 py-1.5 text-sm font-medium transition-colors ${
                            isSelected
                              ? "border-primary bg-primary text-white"
                              : "border-border bg-background text-foreground hover:border-primary/50"
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          );
        },
      },
      {
        id: "generalCondition",
        title: "Allgemeiner Zustand",
        isValid: () => Boolean(formData.generalCondition?.trim()),
        render: () => {
          const options = [
            {
              value: "Eher schlecht",
              label: "Eher schlecht",
              description: "Deutlicher Verschleiß im Innen- und Außenbereich. Hinzu kommen technische Mängel.",
            },
            {
              value: "Mittel",
              label: "Mittel",
              description: "Lediglich normale Gebrauchsspuren im Innenraum und im Außenbereich (kleinere Kratzer oder Dellen). Mechanisch ist das Auto in einem guten Zustand und lässt sich ohne Einschränkung fahren.",
            },
            {
              value: "Gut",
              label: "Gut",
              description: "Einwandfreier Zustand von Innen- und Außenbereich. Das Fahrzeug ist technisch und mechanisch in einem guten Zustand.",
            },
          ];
          return (
            <div className="space-y-4">
              <p className="text-lg font-bold text-foreground mb-4">Gesamtzustand wählen</p>
              <div className="flex flex-col gap-3">
                {options.map((opt) => {
                  const isSelected = formData.generalCondition === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateField("generalCondition", opt.value)}
                      className={`text-left rounded-xl border-2 p-4 transition-all hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                        isSelected ? "border-primary bg-primary/5" : "border-border bg-background"
                      }`}
                    >
                      <p className="font-bold text-foreground mb-1">{opt.label}</p>
                      <p className="text-sm text-muted-foreground">{opt.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        },
      },
      {
        id: "condition",
        title: "Raucherfahrzeug & Unfallfreiheit",
        isValid: () => isAccidentValid() && areUploadsValid(photoFiles, accidentFiles),
        render: () => (
          <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-lg font-bold text-foreground">Raucherfahrzeug</p>
                <p className="text-xs text-muted-foreground">Bitte Auswahl treffen.</p>
              </div>
              <div className="flex gap-2">
                {[
                  { label: "Ja", value: true },
                  { label: "Nein", value: false },
                ].map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => updateField("smoker", option.value)}
                    className={`rounded-full border px-4 py-2 text-lg font-bold transition-colors ${
                      formData.smoker === option.value
                        ? "border-primary bg-primary text-white"
                        : "border-border bg-background text-foreground hover:border-primary"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-lg font-bold text-foreground">Unfallfahrzeug</p>
                <p className="text-xs text-muted-foreground">Falls ja, bitte Details angeben.</p>
              </div>
              <div className="flex gap-2">
                {[
                  { label: "Ja", value: true },
                  { label: "Nein", value: false },
                ].map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => updateField("accident", option.value)}
                    className={`rounded-full border px-4 py-2 text-lg font-bold transition-colors ${
                      formData.accident === option.value
                        ? "border-primary bg-primary text-white"
                        : "border-border bg-background text-foreground hover:border-primary"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {formData.accident && (
              <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-lg font-bold text-foreground">Unfall behoben?</p>
                  <div className="flex gap-2">
                    {[
                      { label: "Ja", value: true },
                      { label: "Nein", value: false },
                    ].map((option) => (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() => updateField("accidentRepaired", option.value)}
                        className={`rounded-full border px-4 py-2 text-lg font-bold transition-colors ${
                          formData.accidentRepaired === option.value
                            ? "border-primary bg-primary text-white"
                            : "border-border bg-background text-foreground hover:border-primary"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-lg font-bold text-foreground">Art des Schadens</label>
                  <Textarea
                    value={formData.accidentDescription}
                    onChange={(event) => updateField("accidentDescription", event.target.value)}
                    placeholder="Kurzbeschreibung des Schadens"
                    className="mt-2 min-h-[120px]"
                  />
                </div>

                <div>
                  <label className="text-lg font-bold text-foreground">Schadenshöhe (EUR)</label>
                  <Input
                    value={formData.accidentAmount}
                    onChange={(event) => updateField("accidentAmount", event.target.value)}
                    placeholder="z.B. 2500"
                    className="mt-2"
                  />
                </div>

                <div>
                  <label className="text-lg font-bold text-foreground">Gutachten / Dokumente</label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Hier können Sie Fotos oder Gutachten zum Unfallschaden einfügen.
                  </p>
                  <div
                    className="mt-3 rounded-xl border border-dashed border-border bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      const list = event.dataTransfer?.files;
                      if (list?.length) {
                        setTimeout(() => handleAccidentFiles(list), 0);
                      }
                    }}
                  >
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background text-foreground">
                      <ImagePlus className="h-5 w-5" />
                    </div>
                    <p className="mt-3 text-lg font-bold text-foreground">
                      Drag & Drop, Dokumente oder Bilder einfügen
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Max. {maxPhotoFiles} Dateien, {maxPhotoSizeMb} MB pro Datei, insgesamt {maxTotalUploadSizeMb} MB.
                    </p>
                    <div className="mt-4 flex justify-center">
                      <label className="relative inline-flex cursor-pointer">
                        <span className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-lg font-bold text-white hover:bg-primary/90 pointer-events-none">
                          Datei auswählen
                        </span>
                        <input
                          type="file"
                          multiple
                          accept={allowedUploadTypes.join(",")}
                          onChange={(event) => {
                            const list = event.target.files;
                            if (list?.length) {
                              setTimeout(() => {
                                handleAccidentFiles(list);
                                event.target.value = "";
                              }, 0);
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          style={{ fontSize: 0 }}
                        />
                      </label>
                    </div>
                  </div>
                  {accidentError && (
                    <p className="mt-2 text-xs text-destructive">{accidentError}</p>
                  )}
                  {accidentFiles.length > 0 && (
                    <div className="mt-3 rounded-xl border border-border bg-background p-3 text-xs text-muted-foreground">
                      <div className="space-y-2">
                        {accidentFiles.map((file) => (
                          <div
                            key={file.name}
                            className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                          >
                            <span className="truncate">{file.name}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setAccidentFiles((prev) =>
                                  prev.filter((item) => item !== file),
                                )
                              }
                              className="ml-3 text-xs font-semibold text-muted-foreground hover:text-primary"
                              aria-label={`${file.name} entfernen`}
                            >
                              X
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <UploadLimitsCallout photoFiles={photoFiles} accidentFiles={accidentFiles} />
          </div>
        ),
      },
      {
        id: "vin",
        title: "Fahrgestellnummer (VIN)",
        isValid: isVinValid,
        render: () => (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 h-4 w-4 text-primary" />
                <p>
                  Anhand der Fahrgestellnummer können wir Ausstattung und Historie besser
                  einordnen.
                </p>
              </div>
            </div>
            <div>
              <label className="text-lg font-bold text-foreground">VIN (17-stellig)</label>
              <Input
                value={formData.vin}
                onChange={(event) =>
                  updateField("vin", event.target.value.toUpperCase().slice(0, 17))
                }
                placeholder="WBA...."
                className="mt-2 tracking-[0.2em] uppercase"
              />
              <p className="mt-2 text-xs text-muted-foreground">Ohne I, O, Q.</p>
            </div>
          </div>
        ),
      },
      {
        id: "photos",
        title: "Fotos Upload (optional)",
        isValid: () => areUploadsValid(photoFiles, accidentFiles),
        render: () => (
          <div className="space-y-4">
            <div
              className="rounded-xl border border-dashed border-border bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const list = event.dataTransfer?.files;
                if (list?.length) {
                  setTimeout(() => handlePhotoFiles(list), 0);
                }
              }}
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background text-foreground">
                <ImagePlus className="h-5 w-5" />
              </div>
              <p className="mt-3 text-lg font-bold text-foreground">
                Drag & Drop, Dokumente oder Bilder einfügen
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Max. {maxPhotoFiles} Dateien, {maxPhotoSizeMb} MB pro Datei, insgesamt {maxTotalUploadSizeMb} MB.
              </p>
              <div className="mt-4 flex justify-center">
                <label className="relative inline-flex cursor-pointer">
                  <span className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-lg font-bold text-white hover:bg-primary/90 pointer-events-none">
                    Datei auswählen
                  </span>
                  <input
                    type="file"
                    multiple
                    accept={allowedUploadTypes.join(",")}
                    onChange={(event) => {
                      const list = event.target.files;
                      if (list?.length) {
                        setTimeout(() => {
                          handlePhotoFiles(list);
                          event.target.value = "";
                        }, 0);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    style={{ fontSize: 0 }}
                  />
                </label>
              </div>
            </div>
            {photoError && (
              <p className="mt-2 text-xs text-destructive">{photoError}</p>
            )}
            {photoFiles.length > 0 && (
              <div className="rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">
                <div className="space-y-2">
                  {photoFiles.map((file) => (
                    <div
                      key={file.name}
                      className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                    >
                      <span className="truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setPhotoFiles((prev) => prev.filter((item) => item !== file))
                        }
                        className="ml-3 text-xs font-semibold text-muted-foreground hover:text-primary"
                        aria-label={`${file.name} entfernen`}
                      >
                        X
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <UploadLimitsCallout photoFiles={photoFiles} accidentFiles={accidentFiles} />
          </div>
        ),
      },
      {
        id: "priceExpectation",
        title: "realistische Preisvorstellung",
        isValid: () => Boolean(formData.priceExpectation.trim()),
        render: () => (
          <div className="space-y-4">
            <div>
              <label className="text-lg font-bold text-foreground">
                <span className="text-primary font-extrabold">realistische</span> Preisvorstellung (€)
              </label>
              <Input
                value={formatPriceWithDots(formData.priceExpectation)}
                onChange={(event) => {
                  const digits = event.target.value.replace(/\D/g, "").slice(0, 6);
                  updateField("priceExpectation", digits);
                }}
                placeholder="z.B. 12.500"
                inputMode="numeric"
                pattern="[0-9.]*"
                className="mt-2"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Geben Sie einen Wunschpreis in Euro an.
              </p>
            </div>
          </div>
        ),
      },
      {
        id: "contact",
        title: "Kontaktdaten",
        isValid: () => isContactValid() && areUploadsValid(photoFiles, accidentFiles),
        render: () => (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-lg font-bold text-foreground">Vorname</label>
                <Input
                  value={formData.contactFirstName}
                  onChange={(event) => updateField("contactFirstName", event.target.value)}
                  placeholder="Max"
                  className="mt-2"
                />
              </div>
              <div>
                <label className="text-lg font-bold text-foreground">Nachname</label>
                <Input
                  value={formData.contactLastName}
                  onChange={(event) => updateField("contactLastName", event.target.value)}
                  placeholder="Mustermann"
                  className="mt-2"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-lg font-bold text-foreground">Mobilnummer</label>
                <Input
                  value={formData.contactPhone}
                  onChange={(event) => updateField("contactPhone", event.target.value)}
                  placeholder="+49 170 123456"
                  className="mt-2"
                />
              </div>
              <div>
                <label className="text-lg font-bold text-foreground">E-Mail</label>
                <Input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(event) => updateField("contactEmail", event.target.value)}
                  placeholder="name@beispiel.de"
                  className="mt-2"
                />
              </div>
            </div>
            <div>
              <label className="text-lg font-bold text-foreground">Postleitzahl (Wohnort)</label>
              <p className="mt-1 text-sm text-muted-foreground">
                Damit wir wissen, aus welcher Region Sie kommen – 5 Ziffern.
              </p>
              <Input
                value={formData.contactPlz}
                onChange={(e) => updateField("contactPlz", e.target.value.replace(/\D/g, "").slice(0, 5))}
                placeholder="z.B. 47809"
                inputMode="numeric"
                maxLength={5}
                className="mt-2 max-w-[140px]"
                aria-invalid={formData.contactPlz.length > 0 && formData.contactPlz.replace(/\D/g, "").length !== 5}
              />
              {plzLookup === "loading" && (
                <p className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Ort wird ermittelt …
                </p>
              )}
              {plzLookup && plzLookup !== "idle" && plzLookup !== "loading" && (
                <p className={`mt-2 text-sm ${typeof plzLookup === "object" ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                  {typeof plzLookup === "object" ? `Ort: ${plzLookup.city}` : "Diese PLZ wurde nicht gefunden."}
                </p>
              )}
            </div>
            <div>
              <label className="text-lg font-bold text-foreground">Noch etwas mitteilen? (optional)</label>
              <p className="mt-1 text-sm text-muted-foreground">
                Zusätzliche Hinweise, Wünsche oder Fragen – z. B. gewünschter Abholtermin oder Besonderheiten.
              </p>
              <Textarea
                value={formData.contactMessage}
                onChange={(event) => updateField("contactMessage", event.target.value)}
                placeholder="z. B. Rückruf am besten ab 18 Uhr …"
                className="mt-2 min-h-[100px] resize-y"
                rows={4}
              />
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="contact-privacy-consent"
                  checked={formData.contactPrivacyConsent}
                  onCheckedChange={(checked) =>
                    updateField("contactPrivacyConsent", checked === true)
                  }
                  className="mt-0.5"
                  aria-required="true"
                />
                <label
                  htmlFor="contact-privacy-consent"
                  className="text-sm leading-relaxed text-foreground cursor-pointer select-none"
                >
                  <span className="font-semibold text-primary">Pflichtfeld:</span> Ich habe die{" "}
                  <Link
                    to="/datenschutz"
                    className="text-primary underline underline-offset-2 hover:text-primary/90"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Datenschutzerklärung
                  </Link>{" "}
                  zur Kenntnis genommen und bin damit einverstanden, dass ich per E-Mail oder
                  telefonisch mit der Bewertung meines Fahrzeugs kontaktiert werde.
                </label>
              </div>
            </div>

            <UploadLimitsCallout photoFiles={photoFiles} accidentFiles={accidentFiles} />
          </div>
        ),
      },
    ],
    [
      accidentFiles.length,
      accidentError,
      formData,
      interestNumber,
      interestVehicle,
      brandsError,
      brandsLoading,
      mileageFocus,
      mileageInput,
      photoError,
      photoFiles,
      topBrandList,
      topBrands,
      modelsError,
      modelsLoading,
      filteredModels,
      normalizedMake,
      isSubmitting,
      submitError,
      submitSuccess,
      plzLookup,
    ],
  );

  const step = steps[currentStep];
  const canGoNext = step?.isValid() ?? false;
  const isLastStep = currentStep === steps.length - 1;
  const stepInstruction = step ? stepInstructions[step.id] : undefined;

  useEffect(() => {
    if (currentStep > steps.length - 1) {
      setCurrentStep(steps.length - 1);
    }
  }, [currentStep, steps.length]);

  // Beim Schrittwechsel zum oberen Rand des Formular-Blocks scrollen – nur wenn nötig, stets zum Block (nicht zum Titel)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const t = setTimeout(() => {
      const el = document.getElementById(`${containerId}-block`);
      if (!el) return;
      const navbarHeight = window.matchMedia("(min-width: 1024px)").matches ? 135 : 88;
      const rect = el.getBoundingClientRect();
      const currentScrollY = window.scrollY ?? document.documentElement.scrollTop;
      const targetScrollY = currentScrollY + rect.top - navbarHeight;
      // Nur scrollen wenn der Block nicht bereits am richtigen Ort ist (Toleranz 30px)
      if (Math.abs(rect.top - navbarHeight) > 30) {
        window.dispatchEvent(new CustomEvent("programmatic-scroll-start"));
        window.scrollTo({ top: Math.max(0, targetScrollY), behavior: "smooth" });
      }
    }, 50);
    return () => clearTimeout(t);
  }, [currentStep, containerId]);

  const goNext = () => {
    if (!canGoNext) return;
    if (!isLastStep) {
      setCurrentStep((prev) => prev + 1);
      return;
    }
    handleSubmit();
  };

  const goBack = () => setCurrentStep((prev) => Math.max(0, prev - 1));

  const syncHiddenInputs = (form: HTMLFormElement, data: FormData) => {
    const ensureInput = (name: string, value: string) => {
      let input = form.querySelector(`input[name="${name}"]`) as HTMLInputElement | null;
      if (!input) {
        input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        form.appendChild(input);
      }
      input.value = value;
    };

    ensureInput("make", data.make);
    ensureInput("model", data.model);
    ensureInput("trimLine", data.trimLine);
    ensureInput("bodyType", data.bodyType);
    ensureInput("fuelType", data.fuelType);
    ensureInput("power", data.power !== null ? String(data.power) : "");
    ensureInput("firstRegistrationMonth", data.firstRegistrationMonth);
    ensureInput("firstRegistrationYear", data.firstRegistrationYear);
    ensureInput("mileage", data.mileage !== null ? String(data.mileage) : "");
    ensureInput("ownersCount", data.ownersCount !== null ? String(data.ownersCount) : "");
    ensureInput("serviceBook", data.serviceBook === null ? "" : String(data.serviceBook));
    ensureInput("lastServiceMonth", data.lastServiceMonth);
    ensureInput("lastServiceYear", data.lastServiceYear);
    ensureInput("huMonth", data.huMonth);
    ensureInput("huYear", data.huYear);
    ensureInput("huExpired", String(data.huExpired));
    ensureInput("exteriorColor", data.exteriorColor);
    ensureInput("transmission", data.transmission);
    ensureInput("driveType", data.driveType);
    ensureInput("equipment", data.equipment?.join(", ") || "");
    ensureInput("generalCondition", data.generalCondition);
    ensureInput("smoker", data.smoker === null ? "" : String(data.smoker));
    ensureInput("accident", data.accident === null ? "" : String(data.accident));
    ensureInput("accidentRepaired", data.accidentRepaired === null ? "" : String(data.accidentRepaired));
    ensureInput("accidentDescription", data.accidentDescription);
    ensureInput("accidentAmount", data.accidentAmount);
    ensureInput("vin", data.vin);
    ensureInput("priceExpectation", data.priceExpectation);
    ensureInput("interestNumber", interestNumber);
    ensureInput("contactFirstName", data.contactFirstName);
    ensureInput("contactLastName", data.contactLastName);
    ensureInput("contactPhone", data.contactPhone);
    ensureInput("contactEmail", data.contactEmail);
    ensureInput("contactPlz", data.contactPlz);
    ensureInput("contactCity", data.contactCity);
    ensureInput("contactMessage", data.contactMessage);
    ensureInput("contactPrivacyConsent", data.contactPrivacyConsent ? "Ja" : "");
  };

  const handleSubmit = () => {
    if (!isContactValid()) return;
    if (!areUploadsValid(photoFiles, accidentFiles)) {
      const msgs = getUploadValidationMessages(photoFiles, accidentFiles);
      setSubmitError(msgs.length ? msgs.join(" ") : `Dateien zu groß (max. ${maxTotalUploadSizeMb} MB gesamt).`);
      return;
    }
    if (onSubmit) {
      onSubmit(formData);
      return;
    }

    const payload = {
      make: formData.make,
      model: formData.model,
      trimLine: formData.trimLine || "",
      bodyType: formData.bodyType,
      fuelType: formData.fuelType,
      power: formData.power !== null ? String(formData.power) : "",
      firstRegistration: formData.firstRegistrationMonth && formData.firstRegistrationYear
        ? `${formData.firstRegistrationMonth}/${formData.firstRegistrationYear}`
        : "",
      mileage: formData.mileage !== null ? `${formData.mileage} km` : "",
      ownersCount: formData.ownersCount !== null ? String(formData.ownersCount) : "",
      serviceBook: formData.serviceBook === null ? "" : formData.serviceBook ? "Ja" : "Nein",
      lastService: formData.lastServiceMonth && formData.lastServiceYear
        ? `${formData.lastServiceMonth}/${formData.lastServiceYear}`
        : "",
      hu: formData.huExpired
        ? "Abgelaufen"
        : formData.huMonth && formData.huYear
        ? `${formData.huMonth}/${formData.huYear}`
        : "",
      exteriorColor: formData.exteriorColor || "",
      transmission: formData.transmission || "",
      driveType: formData.driveType || "",
      equipment: formData.equipment?.length ? formData.equipment.join(", ") : "",
      generalCondition: formData.generalCondition || "",
      smoker: formData.smoker === null ? "" : formData.smoker ? "Ja" : "Nein",
      accident: formData.accident === null ? "" : formData.accident ? "Ja" : "Nein",
      accidentRepaired:
        formData.accidentRepaired === null ? "" : formData.accidentRepaired ? "Ja" : "Nein",
      accidentDescription: formData.accidentDescription,
      accidentAmount: formData.accidentAmount,
      vin: formData.vin,
      priceExpectation: formData.priceExpectation,
      interestNumber,
      interestVehicle: interestVehicle
        ? `${interestVehicle.brand} ${interestVehicle.model} (${interestVehicle.internalNumber || "-"})`
        : "",
      photoFiles: photoFiles.length ? photoFiles.map((file) => file.name).join(", ") : "",
      accidentFiles: accidentFiles.length ? accidentFiles.map((file) => file.name).join(", ") : "",
      contactFirstName: formData.contactFirstName,
      contactLastName: formData.contactLastName,
      contactPhone: formData.contactPhone,
      contactEmail: formData.contactEmail,
      contactPlz: formData.contactPlz,
      contactCity: formData.contactCity,
      contactMessage: formData.contactMessage.trim() || "",
      contactPrivacyConsent: formData.contactPrivacyConsent ? "Ja" : "Nein",
    };

    setIsSubmitting(true);
    setSubmitError("");
    setSubmitSuccess(false);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), submitRequestTimeoutMs);

    const postMultipart = () => {
      const formDataToSend = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        formDataToSend.append(key, value ?? "");
      });
      photoFiles.forEach((file) => formDataToSend.append("photoFiles", file, file.name));
      accidentFiles.forEach((file) => formDataToSend.append("accidentFiles", file, file.name));
      return fetch(getPurchaseInquiryUrl(), {
        method: "POST",
        body: formDataToSend,
        signal: controller.signal,
      });
    };

    const handleResponse = async (response: Response) => {
      const contentType = response.headers.get("content-type") ?? "";
      const jsonPayload = contentType.includes("application/json")
        ? await response.json().catch(() => null)
        : null;
      if (!response.ok) {
        const apiError = typeof jsonPayload?.error === "string" ? jsonPayload.error.trim() : "";
        const serverSaysFileSize = /zu groß|MB|Datei/i.test(apiError) && response.status === 413;
        if (response.status === 413) {
          throw new Error(
            serverSaysFileSize
              ? apiError
              : "Die Fotos konnten leider nicht übermittelt werden. Bitte weniger Bilder auswählen oder die Dateien verkleinern und es erneut versuchen.",
          );
        }
        if (response.status >= 500) {
          throw new Error(
            apiError || "Der Dienst ist gerade nicht erreichbar. Bitte versuchen Sie es später erneut.",
          );
        }
        throw new Error(
          apiError || "Die Anfrage konnte nicht gesendet werden. Bitte prüfen Sie Ihre Angaben und versuchen Sie es erneut.",
        );
      }
      return jsonPayload;
    };

    void (async () => {
      try {
        let response: Response;
        const hasFiles = photoFiles.length > 0 || accidentFiles.length > 0;

        if (hasFiles) {
          const filesMeta = [
            ...photoFiles.map((f) => ({
              kind: "photo" as const,
              name: f.name,
              size: f.size,
              contentType: f.type || "application/octet-stream",
            })),
            ...accidentFiles.map((f) => ({
              kind: "accident" as const,
              name: f.name,
              size: f.size,
              contentType: f.type || "application/octet-stream",
            })),
          ];

          const prepRes = await fetch(getPurchaseInquirySubUrl("prepare-uploads"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ files: filesMeta }),
            signal: controller.signal,
          });

          if (prepRes.ok) {
            const prep = (await prepRes.json()) as {
              success?: boolean;
              sessionId?: string;
              slots?: Array<{
                path: string;
                signedUrl: string;
                token: string;
                originalName: string;
                kind: "photo" | "accident";
              }>;
            };
            if (!prep.success || !prep.sessionId || !prep.slots?.length) {
              throw new Error("Upload-Vorbereitung fehlgeschlagen. Bitte erneut versuchen.");
            }

            const orderedFiles: File[] = [...photoFiles, ...accidentFiles];
            const parallel = 4;
            for (let i = 0; i < prep.slots.length; i += parallel) {
              const chunk = prep.slots.slice(i, i + parallel);
              await Promise.all(
                chunk.map(async (slot, j) => {
                  const file = orderedFiles[i + j];
                  const put = await fetch(slot.signedUrl, {
                    method: "PUT",
                    body: file,
                    headers: {
                      "Content-Type": file.type || "application/octet-stream",
                      Authorization: `Bearer ${slot.token}`,
                    },
                    signal: controller.signal,
                  });
                  if (!put.ok) {
                    throw new Error(`Die Datei „${file.name}“ konnte nicht hochgeladen werden.`);
                  }
                }),
              );
            }

            const uploaded = prep.slots.map((s) => ({
              path: s.path,
              originalName: s.originalName,
              kind: s.kind,
            }));

            response = await fetch(getPurchaseInquirySubUrl("complete"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                sessionId: prep.sessionId,
                uploaded,
                ...payload,
              }),
              signal: controller.signal,
            });
          } else if (prepRes.status === 503) {
            response = await postMultipart();
          } else {
            const errBody = await prepRes.json().catch(() => null);
            const apiError = typeof errBody?.error === "string" ? errBody.error.trim() : "";
            throw new Error(
              apiError || "Die Fotos konnten nicht vorbereitet werden. Bitte erneut versuchen.",
            );
          }
        } else {
          response = await postMultipart();
        }

        await handleResponse(response);

        skipDraftPersistenceRef.current = true;
        clearVehiclePurchaseDraft();
        setSubmitSuccess(true);
        navigate("/kontakt-erfolgreich", { replace: true });
      } catch (error: unknown) {
        let message = error instanceof Error ? error.message : "";
        if (error instanceof DOMException && error.name === "AbortError") {
          setSubmitError(
            "Die Anfrage hat zu lange gedauert. Bitte erneut versuchen (ggf. weniger/kleinere Dateien).",
          );
          return;
        }
        if (message === "Failed to fetch" || message.includes("NetworkError")) {
          message = "Keine Verbindung zum Server. Bitte Internet prüfen und erneut versuchen.";
        }
        setSubmitError(message || "Senden fehlgeschlagen. Bitte erneut versuchen.");
      } finally {
        clearTimeout(timeout);
        setIsSubmitting(false);
      }
    })();
  };

  return (
    <section id={containerId} className="py-20 bg-secondary/40 scroll-mt-[88px] lg:scroll-mt-[135px]">
      <div className="container mx-auto px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs tracking-[0.4em] uppercase text-primary mb-3">
              Ankauf-Formular
            </p>
            <h2 className="font-display text-3xl md:text-4xl text-foreground mb-3">
              {mergedLabels.title}
            </h2>
            <p className="text-muted-foreground">{mergedLabels.subtitle}</p>
          </div>

          <div
            id={`${containerId}-block`}
            className={`rounded-2xl border border-border bg-background shadow-soft overflow-hidden scroll-mt-[88px] lg:scroll-mt-[135px] ${currentStep === 0 ? "md:p-10 p-6" : "p-6 md:p-8"}`}
          >
            {currentStep === 0 ? (
              /* Titelslide – dunkler Header, modern & clean */
              <>
                <div className="text-center py-10 px-6 -mx-6 md:-mx-8 -mt-6 md:-mt-8 mb-8 bg-[#0f2439]">
                  <p className="text-xs uppercase tracking-[0.35em] text-primary-foreground/70 mb-2">
                    Los geht's
                  </p>
                  <h3 className="text-2xl md:text-3xl font-display font-semibold text-white tracking-tight">
                    Bereit für Ihre Bewertung
                  </h3>
                  <p className="text-sm text-white/75 mt-2 max-w-md mx-auto">
                    In wenigen Schritten erfassen wir die Daten Ihres Fahrzeugs.
                  </p>
                </div>
                <div className="py-8 md:py-10">
                  {step?.render()}
                </div>
              </>
            ) : (
              /* Normale Formular-Slides */
              <>
                <div className="mb-4 space-y-3">
                  <div className="w-full rounded-lg bg-[#0b1d3a] px-4 py-4 text-lg md:text-xl font-display font-semibold text-white tracking-wide shadow-sm">
                    {step?.title}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Schritt {currentStep + 1} von {steps.length}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-primary/10 mb-6">
                  <div
                    className="h-2 rounded-full bg-primary transition-all"
                    style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                  />
                </div>

                {stepInstruction && (
                  <div className="mb-6 relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-4 py-4 shadow-sm">
                    <div className="absolute left-0 top-0 h-full w-1 bg-primary" />
                    <p className="text-xs uppercase tracking-[0.3em] text-primary/80">
                      {step?.id === "priceExpectation" ? (
                        <><span className="font-extrabold text-primary">realistische</span> Preisvorstellung</>
                      ) : (
                        stepInstruction.title
                      )}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-foreground">
                      {stepInstruction.text}
                    </p>
                  </div>
                )}
                <div className="min-h-[280px]">{step?.render()}</div>
              </>
            )}

            <div className={`flex flex-col-reverse gap-3 sm:flex-row sm:justify-between ${currentStep === 0 ? "pt-0 mt-8" : "mt-8"}`}>
              <button
                type="button"
                onClick={goBack}
                disabled={currentStep === 0}
                className="rounded-md border border-border px-5 py-2 text-lg font-bold text-foreground transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                {mergedLabels.back}
              </button>

              <button
                type="button"
                onClick={goNext}
                disabled={!canGoNext || isSubmitting}
                className={`flex items-center justify-center gap-2 rounded-md px-6 py-2 text-lg font-bold text-white transition-colors ${
                  canGoNext && !isSubmitting
                    ? "bg-primary hover:bg-primary/90"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                {isSubmitting ? "Sende..." : isLastStep ? mergedLabels.submit : currentStep === 0 ? (mergedLabels.start ?? "Starten") : mergedLabels.next}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            {isSubmitting && (
              <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-foreground flex items-start gap-3">
                <Loader2 className="h-4 w-4 mt-0.5 animate-spin text-primary" />
                <p>
                  Anfrage wird verarbeitet. Bei vielen Dateien kann das bis zu 1-2 Minuten dauern.
                  Hochgeladene Fotos: {photoFiles.length}, Gutachten/Dokumente: {accidentFiles.length}.
                </p>
              </div>
            )}
            {submitError && (
              <p className="mt-4 text-sm text-destructive">{submitError}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default VehiclePurchaseForm;
