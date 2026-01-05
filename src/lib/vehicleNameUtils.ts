/**
 * Utility functions for formatting vehicle names
 */

/**
 * Splits a vehicle model name into base model (Baureihe) and variant/trim
 * Base model includes: first word (Baureihe like "X1", "i4", "A4") + optional generation code (like "F48", "G20")
 * Everything else goes to variant
 * 
 * Examples:
 * "X1 F48" -> { base: "X1 F48", variant: "" }
 * "i4 eDrive40 GC M-SPORT-PRO" -> { base: "i4", variant: "eDrive40 GC M-SPORT-PRO" }
 * "320d" -> { base: "320d", variant: "" }
 * "C 300" -> { base: "C 300", variant: "" }
 * "C 300 AMG" -> { base: "C 300", variant: "AMG" }
 * "A4 Avant 40 TDI" -> { base: "A4", variant: "Avant 40 TDI" }
 */
export function splitModelName(model: string): { base: string; variant: string } {
  if (!model) return { base: "", variant: "" };
  
  const words = model.trim().split(/\s+/);
  
  // If only 1 word, it's the base model
  if (words.length === 1) {
    return { base: words[0], variant: "" };
  }
  
  // Check if second word is a generation code (like "F48", "G20", "W205") - usually letter(s) + numbers
  // Generation codes pattern: 1-2 letters followed by 2-3 digits (e.g., F48, G20, W205, E46)
  const generationCodePattern = /^[A-Z]{1,2}\d{2,3}$/i;
  
  // If 2 words, check if second word is a generation code or a number
  if (words.length === 2) {
    const secondWord = words[1];
    if (generationCodePattern.test(secondWord) || /^\d+[a-z]?$/i.test(secondWord)) {
      // Both words are base (e.g., "X1 F48", "C 300")
      return { base: model, variant: "" };
    } else {
      // First word is base, second is variant (e.g., "A4 Avant")
      return { base: words[0], variant: words[1] };
    }
  }
  
  // If 3+ words
  const secondWord = words[1];
  const thirdWord = words[2];
  
  // Check if second word is a generation code
  if (generationCodePattern.test(secondWord)) {
    // First 2 words are base (Baureihe + Generation Code), rest is variant
    // Example: "X1 F48 xDrive20d" -> base: "X1 F48", variant: "xDrive20d"
    return { 
      base: words.slice(0, 2).join(" "), 
      variant: words.slice(2).join(" ") 
    };
  }
  
  // Check if second word is a number (like "C 300")
  if (/^\d+[a-z]?$/i.test(secondWord)) {
    // First 2 words are base, rest is variant
    // Example: "C 300 AMG" -> base: "C 300", variant: "AMG"
    return { 
      base: words.slice(0, 2).join(" "), 
      variant: words.slice(2).join(" ") 
    };
  }
  
  // Otherwise, first word is base (Baureihe), rest is variant
  // Example: "i4 eDrive40 GC M-SPORT-PRO" -> base: "i4", variant: "eDrive40 GC M-SPORT-PRO"
  return { 
    base: words[0], 
    variant: words.slice(1).join(" ") 
  };
}
