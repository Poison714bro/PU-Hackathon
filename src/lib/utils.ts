import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import * as colors from "./colors";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Re-export all formatting and color utilities from centralized colors.ts
export {
  // Colors
  DRUG_CATEGORY_COLORS,
  RISK_COLORS,
  SEVERITY_COLORS,
  STATUS_COLORS,
  SOURCE_STREAM_COLORS,
  SUSPECT_ROLE_COLORS,
  NODE_TYPE_COLORS,
  EDGE_CRITERIA_COLORS,
  KANBAN_COLUMN_COLORS,
  PLATFORM_COLORS,
  CSS_VARIABLES,
  // Functions
  getDrugColor,
  getRiskColor,
  getRiskLabel,
  getTimeAgo,
  formatNumber,
  formatCurrency,
  formatDate,
  formatTime,
  getSeverityColors,
  getStatusColors,
  getSuspectRoleColors,
  getNodeTypeColors,
  getEdgeCriteriaColors,
  getSourceStreamColor,
} from "./colors";
