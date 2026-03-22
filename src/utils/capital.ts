import type { CapitalType } from "@/types";

export function getCapitalTypeLabel(type: CapitalType): string {
  switch (type) {
    case "initial":
      return "Modal Awal";
    case "addition":
      return "Tambah Modal";
    case "loan":
      return "Pinjaman";
    case "investor":
      return "Investasi";
    case "withdrawal":
      return "Penarikan";
    default:
      return type;
  }
}

export function getCapitalTypeColor(type: CapitalType): string {
  switch (type) {
    case "initial":
      return "text-blue-700 bg-blue-50 border-blue-200";
    case "addition":
      return "text-green-700 bg-green-50 border-green-200";
    case "loan":
      return "text-orange-700 bg-orange-50 border-orange-200";
    case "investor":
      return "text-purple-700 bg-purple-50 border-purple-200";
    case "withdrawal":
      return "text-red-700 bg-red-50 border-red-200";
    default:
      return "text-gray-600 bg-gray-50 border-gray-200";
  }
}

export function getCapitalTypeIcon(type: CapitalType): string {
  switch (type) {
    case "initial":
      return "🏦";
    case "addition":
      return "➕";
    case "loan":
      return "🤝";
    case "investor":
      return "💼";
    case "withdrawal":
      return "💸";
    default:
      return "💰";
  }
}

export function isInflow(type: CapitalType): boolean {
  return type !== "withdrawal";
}
