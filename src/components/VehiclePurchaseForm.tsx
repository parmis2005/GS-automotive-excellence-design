import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, X } from "lucide-react";

// CarQuery endpoints used:
// - https://www.carqueryapi.com/api/0.3/?cmd=getMakes
// - https://www.carqueryapi.com/api/0.3/?cmd=getModels&make=MAKE
// - https://www.carqueryapi.com/api/0.3/?cmd=getTrims&make=MAKE&model=MODEL

const CARQUERY_BASE = "https://www.carqueryapi.com/api/0.3/?";

type FormData = {
  make: string;
  model: string;
  trim: string;
  firstRegistrationMonth: string;
  firstRegistrationYear: string;
  fuel: string;
  powerType: "unknown" | "kw" | "ps";
  powerValue: string;
  bodyType: string;
  transmission: string;
  mileageRange: string;
  mileageExact: string;
  condition: string;
  color: string;
  equipment: string[];
  email: string;
  privacyAccepted: boolean;
};

type Labels = {
  title: string;
  subtitle: string;
  next: string;
  back: string;
  submit: string;
};

type VehiclePurchaseFormProps = {
  containerId?: string;
  formId?: string;
  topBrands?: string[];
  labels?: Partial<Labels>;
  requiredFields?: Array<keyof FormData>;
  onSubmit?: (data: FormData) => void;
};

const defaultLabels: Labels = {
  title: "Fahrzeugankauf Schritt für Schritt",
  subtitle: "Nur die aktuellen Fragen werden angezeigt – schnell und klar.",
  next: "Weiter",
  back: "Zurück",
  submit: "Anfrage absenden",
};

const defaultTopBrands = [
  "BMW",
  "VW",
  "Mercedes",
  "Audi",
  "Ford",
  "Opel",
  "Seat",
  "Hyundai",
  "Mini",
  "Kia",
  "Skoda",
  "Mazda",
];

const fuelOptions = [
  "Benzin",
  "Diesel",
  "Hybrid",
  "Elektro",
  "LPG/CNG",
  "Andere",
];

const bodyTypes = [
  "Kleinwagen",
  "Limousine",
  "Kombi",
  "SUV",
  "Van",
  "Coupe",
  "Cabrio",
  "Andere",
];

const transmissions = ["Manuell", "Automatik"];

const mileageChips = [
  "<50.000 km",
  "50.000-100.000 km",
  "100.000-150.000 km",
  "150.000-200.000 km",
  ">200.000 km",
  "Genau eingeben",
];

const conditions = [
  "Sehr gut",
  "Gut",
  "In Ordnung",
  "Reparaturbedarf",
  "Unfallwagen",
];

const colorOptions = [
  "Schwarz",
  "Weiss",
  "Silber",
  "Grau",
  "Blau",
  "Rot",
  "Grun",
  "Braun",
  "Beige",
  "Andere",
];

const equipmentOptions = [
  "Klima",
  "Navi",
  "Leder",
  "Sitzheizung",
  "Tempomat",
  "PDC",
  "Kamera",
  "LED",
  "Panorama",
  "Head-Up",
  "Keyless",
  "Anhangerkupplung",
];

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

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 40 }, (_, index) => String(currentYear - index));

const defaultRequiredFields: Array<keyof FormData> = [
  "make",
  "model",
  "firstRegistrationMonth",
  "firstRegistrationYear",
  "fuel",
  "bodyType",
  "transmission",
  "mileageRange",
  "condition",
  "color",
  "email",
  "privacyAccepted",
];

const jsonpRequest = (url: string, timeoutMs = 8000) =>
  new Promise<Record<string, unknown>>((resolve, reject) => {
    const callbackName = `carquery_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const script = document.createElement("script");

    const cleanup = () => {
      delete (window as typeof window & Record<string, unknown>)[callbackName];
      script.remove();
    };

    (window as typeof window & Record<string, unknown>)[callbackName] = (data: Record<string, unknown>) => {
      cleanup();
      resolve(data);
    };

    script.src = `${url}${url.includes("?") ? "&" : "?"}callback=${callbackName}`;
    script.onerror = () => {
      cleanup();
      reject(new Error("CarQuery request failed"));
    };

    document.body.appendChild(script);

    window.setTimeout(() => {
      cleanup();
      reject(new Error("CarQuery request timed out"));
    }, timeoutMs);
  });

const useDebouncedValue = (value: string, delayMs = 200) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
};

const VehiclePurchaseForm = ({
  containerId = "vehicle-purchase-form",
  formId = "vehicleForm",
  topBrands = defaultTopBrands,
  labels,
  requiredFields = defaultRequiredFields,
  onSubmit,
}: VehiclePurchaseFormProps) => {
  const mergedLabels = { ...defaultLabels, ...labels };
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    make: "",
    model: "",
    trim: "",
    firstRegistrationMonth: "",
    firstRegistrationYear: "",
    fuel: "",
    powerType: "unknown",
    powerValue: "",
    bodyType: "",
    transmission: "",
    mileageRange: "",
    mileageExact: "",
    condition: "",
    color: "",
    equipment: [],
    email: "",
    privacyAccepted: false,
  });

  const [allBrands, setAllBrands] = useState<string[]>([]);
  const [brandLoading, setBrandLoading] = useState(true);
  const [brandError, setBrandError] = useState(false);

  const [models, setModels] = useState<string[]>([]);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelError, setModelError] = useState(false);

  const [trims, setTrims] = useState<string[]>([]);
  const [trimLoading, setTrimLoading] = useState(false);
  const [hasTrimStep, setHasTrimStep] = useState(false);

  const [brandPanelOpen, setBrandPanelOpen] = useState(false);
  const [modelPanelOpen, setModelPanelOpen] = useState(false);

  const [brandSearch, setBrandSearch] = useState("");
  const [modelSearch, setModelSearch] = useState("");
  const [trimSearch, setTrimSearch] = useState("");

  const debouncedBrandSearch = useDebouncedValue(brandSearch);
  const debouncedModelSearch = useDebouncedValue(modelSearch);
  const debouncedTrimSearch = useDebouncedValue(trimSearch);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setBrandPanelOpen(false);
        setModelPanelOpen(false);
      }
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, []);

  useEffect(() => {
    const fetchBrands = async () => {
      setBrandLoading(true);
      setBrandError(false);
      try {
        const data = await jsonpRequest(`${CARQUERY_BASE}cmd=getMakes`);
        const makes = (data?.Makes as Array<{ make_display: string }> | undefined) || [];
        const makeNames = makes.map((make) => make.make_display).filter(Boolean).sort();
        setAllBrands(makeNames);
      } catch (error) {
        setBrandError(true);
      } finally {
        setBrandLoading(false);
      }
    };

    fetchBrands();
  }, []);

  useEffect(() => {
    if (!formData.make || brandError) {
      setModels([]);
      return;
    }

    const fetchModels = async () => {
      setModelLoading(true);
      setModelError(false);
      try {
        const data = await jsonpRequest(
          `${CARQUERY_BASE}cmd=getModels&make=${encodeURIComponent(formData.make)}`,
        );
        const modelsData = (data?.Models as Array<{ model_name: string }> | undefined) || [];
        const modelNames = modelsData.map((model) => model.model_name).filter(Boolean).sort();
        setModels(modelNames);
      } catch (error) {
        setModelError(true);
      } finally {
        setModelLoading(false);
      }
    };

    fetchModels();
  }, [formData.make, brandError]);

  useEffect(() => {
    if (!formData.make || !formData.model || brandError || modelError) {
      setTrims([]);
      setHasTrimStep(false);
      return;
    }

    const fetchTrims = async () => {
      setTrimLoading(true);
      try {
        const data = await jsonpRequest(
          `${CARQUERY_BASE}cmd=getTrims&make=${encodeURIComponent(formData.make)}&model=${encodeURIComponent(formData.model)}`,
        );
        const trimsData = (data?.Trims as Array<{ model_trim: string }> | undefined) || [];
        const trimNames = trimsData.map((trim) => trim.model_trim).filter(Boolean).sort();
        setTrims(trimNames);
        setHasTrimStep(trimNames.length > 0);
      } catch (error) {
        setTrims([]);
        setHasTrimStep(false);
      } finally {
        setTrimLoading(false);
      }
    };

    fetchTrims();
  }, [formData.make, formData.model, brandError, modelError]);

  const filteredBrands = useMemo(() => {
    if (!debouncedBrandSearch) return allBrands;
    return allBrands.filter((brand) =>
      brand.toLowerCase().includes(debouncedBrandSearch.toLowerCase()),
    );
  }, [allBrands, debouncedBrandSearch]);

  const filteredModels = useMemo(() => {
    if (!debouncedModelSearch) return models;
    return models.filter((model) =>
      model.toLowerCase().includes(debouncedModelSearch.toLowerCase()),
    );
  }, [models, debouncedModelSearch]);

  const filteredTrims = useMemo(() => {
    if (!debouncedTrimSearch) return trims;
    return trims.filter((trim) =>
      trim.toLowerCase().includes(debouncedTrimSearch.toLowerCase()),
    );
  }, [trims, debouncedTrimSearch]);

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleEquipment = (item: string) => {
    setFormData((prev) => ({
      ...prev,
      equipment: prev.equipment.includes(item)
        ? prev.equipment.filter((entry) => entry !== item)
        : [...prev.equipment, item],
    }));
  };

  const isStepValid = (requiredKeys: Array<keyof FormData>) =>
    requiredKeys.every((key) => {
      const value = formData[key];
      if (typeof value === "boolean") return value;
      if (Array.isArray(value)) return value.length > 0;
      return Boolean(value);
    });

  const baseSteps = useMemo(
    () => [
      {
        id: "make",
        title: "Marke auswählen",
        required: ["make"],
        content: (
          <div className="space-y-6">
            {brandError ? (
              <div className="rounded-lg border border-border bg-background p-4 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground mb-2">Marke manuell eingeben</p>
                <input
                  type="text"
                  value={formData.make}
                  onChange={(event) => updateField("make", event.target.value)}
                  className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="z.B. BMW"
                />
              </div>
            ) : (
              <>
                <div>
                  <p className="text-sm font-semibold text-foreground mb-3">Top Marken</p>
                  <div className="flex flex-wrap gap-2">
                    {topBrands.map((brand) => (
                      <button
                        key={brand}
                        type="button"
                        onClick={() => {
                          updateField("make", brand);
                          updateField("model", "");
                          updateField("trim", "");
                        }}
                        className={`rounded-full border px-4 py-2 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                          formData.make === brand
                            ? "bg-primary text-white border-primary"
                            : "border-border bg-background hover:border-primary"
                        }`}
                      >
                        {brand}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Nicht dabei?</p>
                  <button
                    type="button"
                    onClick={() => setBrandPanelOpen(true)}
                    className="text-sm font-semibold text-primary hover:text-primary/80"
                    aria-haspopup="dialog"
                    aria-expanded={brandPanelOpen}
                  >
                    Alle ansehen ▾
                  </button>
                </div>
              </>
            )}
          </div>
        ),
      },
      {
        id: "model",
        title: "Modell auswählen",
        required: ["model"],
        content: brandError ? (
          <div className="rounded-lg border border-border bg-background p-4 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground mb-2">Modell manuell eingeben</p>
            <input
              type="text"
              value={formData.model}
              onChange={(event) => updateField("model", event.target.value)}
              className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="z.B. 3er"
            />
          </div>
        ) : (
          <div className="space-y-4">
            {modelLoading ? (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Modelle werden geladen ...
              </div>
            ) : modelError ? (
              <div className="rounded-lg border border-border bg-background p-4 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground mb-2">Modell manuell eingeben</p>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(event) => updateField("model", event.target.value)}
                  className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="z.B. Golf"
                />
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {filteredModels.slice(0, 12).map((model) => (
                    <button
                      key={model}
                      type="button"
                      onClick={() => {
                        updateField("model", model);
                        updateField("trim", "");
                      }}
                      className={`rounded-full border px-4 py-2 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        formData.model === model
                          ? "bg-primary text-white border-primary"
                          : "border-border bg-background hover:border-primary"
                      }`}
                    >
                      {model}
                    </button>
                  ))}
                </div>
                {models.length > 12 && (
                  <button
                    type="button"
                    onClick={() => setModelPanelOpen(true)}
                    className="text-sm font-semibold text-primary hover:text-primary/80"
                    aria-haspopup="dialog"
                    aria-expanded={modelPanelOpen}
                  >
                    Alle ansehen ▾
                  </button>
                )}
              </>
            )}
          </div>
        ),
      },
      {
        id: "trim",
        title: "Variante auswählen",
        required: [],
        hidden: !hasTrimStep,
        content: (
          <div className="space-y-4">
            {trimLoading ? (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Varianten werden geladen ...
              </div>
            ) : trims.length === 0 ? (
              <p className="text-sm text-muted-foreground">Keine Varianten gefunden. Schritt wird ubersprungen.</p>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={trimSearch}
                    onChange={(event) => setTrimSearch(event.target.value)}
                    className="w-full rounded-md border border-border bg-background px-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Variante suchen"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {filteredTrims.slice(0, 16).map((trim) => (
                    <button
                      key={trim}
                      type="button"
                      onClick={() => updateField("trim", trim)}
                      className={`rounded-full border px-4 py-2 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        formData.trim === trim
                          ? "bg-primary text-white border-primary"
                          : "border-border bg-background hover:border-primary"
                      }`}
                    >
                      {trim}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        ),
      },
      {
        id: "firstRegistration",
        title: "Erstzulassung",
        required: ["firstRegistrationMonth", "firstRegistrationYear"],
        content: (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-foreground">Monat</label>
              <select
                value={formData.firstRegistrationMonth}
                onChange={(event) => updateField("firstRegistrationMonth", event.target.value)}
                className="mt-2 w-full rounded-md border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Monat wahlen</option>
                {months.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground">Jahr</label>
              <select
                value={formData.firstRegistrationYear}
                onChange={(event) => updateField("firstRegistrationYear", event.target.value)}
                className="mt-2 w-full rounded-md border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Jahr wahlen</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ),
      },
      {
        id: "fuel",
        title: "Kraftstoff",
        required: ["fuel"],
        content: (
          <div className="flex flex-wrap gap-2">
            {fuelOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => updateField("fuel", option)}
                className={`rounded-full border px-4 py-2 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  formData.fuel === option
                    ? "bg-primary text-white border-primary"
                    : "border-border bg-background hover:border-primary"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        ),
      },
      {
        id: "power",
        title: "Motorisierung / Leistung",
        required: [],
        content: (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Ich weiss es nicht", value: "unknown" },
                { label: "kW", value: "kw" },
                { label: "PS", value: "ps" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateField("powerType", option.value as FormData["powerType"])}
                  className={`rounded-full border px-4 py-2 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    formData.powerType === option.value
                      ? "bg-primary text-white border-primary"
                      : "border-border bg-background hover:border-primary"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {formData.powerType !== "unknown" && (
              <input
                type="number"
                inputMode="numeric"
                value={formData.powerValue}
                onChange={(event) => updateField("powerValue", event.target.value)}
                className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={`Leistung in ${formData.powerType.toUpperCase()}`}
              />
            )}
          </div>
        ),
      },
      {
        id: "body",
        title: "Karosserieform",
        required: ["bodyType"],
        content: (
          <div className="flex flex-wrap gap-2">
            {bodyTypes.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => updateField("bodyType", option)}
                className={`rounded-full border px-4 py-2 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  formData.bodyType === option
                    ? "bg-primary text-white border-primary"
                    : "border-border bg-background hover:border-primary"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        ),
      },
      {
        id: "transmission",
        title: "Getriebe",
        required: ["transmission"],
        content: (
          <div className="flex flex-wrap gap-2">
            {transmissions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => updateField("transmission", option)}
                className={`rounded-full border px-4 py-2 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  formData.transmission === option
                    ? "bg-primary text-white border-primary"
                    : "border-border bg-background hover:border-primary"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        ),
      },
      {
        id: "mileage",
        title: "Kilometerstand",
        required: ["mileageRange"],
        content: (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {mileageChips.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    updateField("mileageRange", option);
                    if (option !== "Genau eingeben") {
                      updateField("mileageExact", "");
                    }
                  }}
                  className={`rounded-full border px-4 py-2 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    formData.mileageRange === option
                      ? "bg-primary text-white border-primary"
                      : "border-border bg-background hover:border-primary"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            {formData.mileageRange === "Genau eingeben" && (
              <input
                type="number"
                inputMode="numeric"
                value={formData.mileageExact}
                onChange={(event) => updateField("mileageExact", event.target.value)}
                className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Kilometerstand in km"
              />
            )}
          </div>
        ),
      },
      {
        id: "condition",
        title: "Zustand",
        required: ["condition"],
        content: (
          <div className="flex flex-wrap gap-2">
            {conditions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => updateField("condition", option)}
                className={`rounded-full border px-4 py-2 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  formData.condition === option
                    ? "bg-primary text-white border-primary"
                    : "border-border bg-background hover:border-primary"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        ),
      },
      {
        id: "color",
        title: "Fahrzeugfarbe",
        required: ["color"],
        content: (
          <div className="flex flex-wrap gap-2">
            {colorOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => updateField("color", option)}
                className={`rounded-full border px-4 py-2 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  formData.color === option
                    ? "bg-primary text-white border-primary"
                    : "border-border bg-background hover:border-primary"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        ),
      },
      {
        id: "equipment",
        title: "Ausstattung",
        required: [],
        content: (
          <div className="flex flex-wrap gap-2">
            {equipmentOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => toggleEquipment(option)}
                className={`rounded-full border px-4 py-2 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  formData.equipment.includes(option)
                    ? "bg-primary text-white border-primary"
                    : "border-border bg-background hover:border-primary"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        ),
      },
      {
        id: "contact",
        title: "Kontakt",
        required: ["email", "privacyAccepted"],
        content: (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-foreground">E-Mail</label>
              <input
                type="email"
                value={formData.email}
                onChange={(event) => updateField("email", event.target.value)}
                className="mt-2 w-full rounded-md border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="name@beispiel.de"
              />
            </div>
            <label className="flex items-start gap-3 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={formData.privacyAccepted}
                onChange={(event) => updateField("privacyAccepted", event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <span>
                Ich stimme der Verarbeitung meiner Daten zur Kontaktaufnahme zu.
              </span>
            </label>
          </div>
        ),
      },
      {
        id: "summary",
        title: "Zusammenfassung",
        required: requiredFields,
        content: (
          <div className="rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Marke</p>
                <p className="font-semibold text-foreground">{formData.make || "-"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Modell</p>
                <p className="font-semibold text-foreground">{formData.model || "-"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Variante</p>
                <p className="font-semibold text-foreground">{formData.trim || "-"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Erstzulassung</p>
                <p className="font-semibold text-foreground">
                  {formData.firstRegistrationMonth && formData.firstRegistrationYear
                    ? `${formData.firstRegistrationMonth}/${formData.firstRegistrationYear}`
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Kraftstoff</p>
                <p className="font-semibold text-foreground">{formData.fuel || "-"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Karosserie</p>
                <p className="font-semibold text-foreground">{formData.bodyType || "-"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Getriebe</p>
                <p className="font-semibold text-foreground">{formData.transmission || "-"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Kilometer</p>
                <p className="font-semibold text-foreground">
                  {formData.mileageRange === "Genau eingeben"
                    ? formData.mileageExact || "-"
                    : formData.mileageRange || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Zustand</p>
                <p className="font-semibold text-foreground">{formData.condition || "-"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Farbe</p>
                <p className="font-semibold text-foreground">{formData.color || "-"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Ausstattung</p>
                <p className="font-semibold text-foreground">
                  {formData.equipment.length ? formData.equipment.join(", ") : "-"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">E-Mail</p>
                <p className="font-semibold text-foreground">{formData.email || "-"}</p>
              </div>
            </div>
          </div>
        ),
      },
    ],
    [
      brandError,
      formData,
      hasTrimStep,
      modelError,
      modelLoading,
      models,
      requiredFields,
      topBrands,
      trimLoading,
      filteredModels,
      filteredTrims,
      trimSearch,
    ],
  );

  const steps = baseSteps.filter((step) => !step.hidden);
  const step = steps[currentStep];

  useEffect(() => {
    if (!step && steps.length > 0) {
      setCurrentStep(steps.length - 1);
    }
  }, [step, steps.length]);

  const canGoNext = step ? isStepValid(step.required) : false;

  const goNext = () => {
    if (!canGoNext) return;
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
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
    ensureInput("trim", data.trim);
    ensureInput("firstRegistrationMonth", data.firstRegistrationMonth);
    ensureInput("firstRegistrationYear", data.firstRegistrationYear);
    ensureInput("fuel", data.fuel);
    ensureInput("powerType", data.powerType);
    ensureInput("powerValue", data.powerValue);
    ensureInput("bodyType", data.bodyType);
    ensureInput("transmission", data.transmission);
    ensureInput("mileageRange", data.mileageRange);
    ensureInput("mileageExact", data.mileageExact);
    ensureInput("condition", data.condition);
    ensureInput("color", data.color);
    ensureInput("equipment", data.equipment.join(", "));
    ensureInput("email", data.email);
    ensureInput("privacyAccepted", data.privacyAccepted ? "true" : "false");
  };

  const handleSubmit = () => {
    if (!isStepValid(requiredFields)) return;
    if (onSubmit) {
      onSubmit(formData);
      return;
    }

    const targetForm = document.getElementById(formId) as HTMLFormElement | null;
    if (targetForm) {
      syncHiddenInputs(targetForm, formData);
      targetForm.requestSubmit();
    }
  };

  return (
    <section id={containerId} className="py-20 bg-secondary/40">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs tracking-[0.4em] uppercase text-primary mb-3">Ankauf-Formular</p>
            <h2 className="font-display text-3xl md:text-4xl text-foreground mb-3">
              {mergedLabels.title}
            </h2>
            <p className="text-muted-foreground">{mergedLabels.subtitle}</p>
          </div>

          <div className="rounded-2xl border border-border bg-background p-6 md:p-8 shadow-soft">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
              <span>
                Schritt {currentStep + 1} von {steps.length}
              </span>
              <span className="font-semibold text-foreground">{step?.title}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted mb-6">
              <div
                className="h-2 rounded-full bg-primary transition-all"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>

            <div className="min-h-[240px]">{step?.content}</div>

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={goBack}
                disabled={currentStep === 0}
                className="rounded-md border border-border px-5 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                {mergedLabels.back}
              </button>

              {step?.id === "summary" ? (
                <button
                  type="button"
                  onClick={handleSubmit}
                  className={`rounded-md px-6 py-2 text-sm font-semibold text-white transition-colors ${
                    isStepValid(requiredFields) ? "bg-primary hover:bg-primary/90" : "bg-muted text-muted-foreground cursor-not-allowed"
                  }`}
                >
                  {mergedLabels.submit}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!canGoNext}
                  className={`rounded-md px-6 py-2 text-sm font-semibold text-white transition-colors ${
                    canGoNext ? "bg-primary hover:bg-primary/90" : "bg-muted text-muted-foreground cursor-not-allowed"
                  }`}
                >
                  {mergedLabels.next}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {brandPanelOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Alle Marken"
        >
          <div className="w-full max-w-2xl rounded-xl bg-background p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Marke auswahlen</h3>
              <button
                type="button"
                onClick={() => setBrandPanelOpen(false)}
                className="rounded-full p-2 hover:bg-muted"
                aria-label="Panel schliessen"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={brandSearch}
                onChange={(event) => setBrandSearch(event.target.value)}
                className="w-full rounded-md border border-border bg-background px-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Marke suchen"
              />
            </div>
            {brandLoading ? (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Marken werden geladen ...
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto pr-2">
                <div className="flex flex-wrap gap-2">
                  {filteredBrands.map((brand) => (
                    <button
                      key={brand}
                      type="button"
                      onClick={() => {
                        updateField("make", brand);
                        updateField("model", "");
                        updateField("trim", "");
                        setBrandPanelOpen(false);
                      }}
                      className={`rounded-full border px-4 py-2 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        formData.make === brand
                          ? "bg-primary text-white border-primary"
                          : "border-border bg-background hover:border-primary"
                      }`}
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {modelPanelOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Alle Modelle"
        >
          <div className="w-full max-w-2xl rounded-xl bg-background p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Modell auswahlen</h3>
              <button
                type="button"
                onClick={() => setModelPanelOpen(false)}
                className="rounded-full p-2 hover:bg-muted"
                aria-label="Panel schliessen"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={modelSearch}
                onChange={(event) => setModelSearch(event.target.value)}
                className="w-full rounded-md border border-border bg-background px-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Modell suchen"
              />
            </div>
            {modelLoading ? (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Modelle werden geladen ...
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto pr-2">
                <div className="flex flex-wrap gap-2">
                  {filteredModels.map((model) => (
                    <button
                      key={model}
                      type="button"
                      onClick={() => {
                        updateField("model", model);
                        updateField("trim", "");
                        setModelPanelOpen(false);
                      }}
                      className={`rounded-full border px-4 py-2 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        formData.model === model
                          ? "bg-primary text-white border-primary"
                          : "border-border bg-background hover:border-primary"
                      }`}
                    >
                      {model}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default VehiclePurchaseForm;
