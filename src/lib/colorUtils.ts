/**
 * Utility functions for color normalization and mapping
 */

/**
 * Maps specific color names to basic color categories
 * E.g., "Metallic Schwarz" -> "Schwarz", "Perlweiß" -> "Weiß"
 */
export function normalizeColorToBasic(color: string): string {
  if (!color) return "";
  
  const colorLower = color.toLowerCase();
  
  // Schwarz variants
  if (colorLower.includes('schwarz') || colorLower.includes('black')) {
    return "Schwarz";
  }
  
  // Weiß variants
  if (colorLower.includes('weiß') || colorLower.includes('weiss') || colorLower.includes('white') || colorLower.includes('perlweiß')) {
    return "Weiß";
  }
  
  // Silber/Grau variants
  if (colorLower.includes('silber') || colorLower.includes('silver') || colorLower.includes('grau') || colorLower.includes('grey') || colorLower.includes('gray')) {
    return "Silber";
  }
  
  // Blau variants
  if (colorLower.includes('blau') || colorLower.includes('blue')) {
    return "Blau";
  }
  
  // Rot variants
  if (colorLower.includes('rot') || colorLower.includes('red')) {
    return "Rot";
  }
  
  // Grün variants
  if (colorLower.includes('grün') || colorLower.includes('gruen') || colorLower.includes('green')) {
    return "Grün";
  }
  
  // Beige variants
  if (colorLower.includes('beige') || colorLower.includes('tan')) {
    return "Beige";
  }
  
  // Braun variants
  if (colorLower.includes('braun') || colorLower.includes('brown')) {
    return "Braun";
  }
  
  // Gelb variants
  if (colorLower.includes('gelb') || colorLower.includes('yellow')) {
    return "Gelb";
  }
  
  // Orange variants
  if (colorLower.includes('orange')) {
    return "Orange";
  }
  
  // Violett/Lila variants
  if (colorLower.includes('violett') || colorLower.includes('lila') || colorLower.includes('purple') || colorLower.includes('violet')) {
    return "Violett";
  }
  
  // Gold variants
  if (colorLower.includes('gold')) {
    return "Gold";
  }
  
  // Return original if no match found
  return color;
}

/**
 * Gets a CSS color value for a basic color name
 * Used for displaying color circles
 */
export function getColorHex(basicColor: string): string {
  const colorMap: Record<string, string> = {
    "Schwarz": "#000000",
    "Weiß": "#FFFFFF",
    "Silber": "#C0C0C0",
    "Blau": "#0000FF",
    "Rot": "#FF0000",
    "Grün": "#008000",
    "Beige": "#F5F5DC",
    "Braun": "#8B4513",
    "Gelb": "#FFFF00",
    "Orange": "#FFA500",
    "Violett": "#800080",
    "Gold": "#FFD700",
  };
  
  return colorMap[basicColor] || "#CCCCCC";
}

/**
 * List of basic colors in German
 */
export const BASIC_COLORS = [
  "Schwarz",
  "Weiß",
  "Silber",
  "Blau",
  "Rot",
  "Grün",
  "Beige",
  "Braun",
  "Gelb",
  "Orange",
  "Violett",
  "Gold",
];
