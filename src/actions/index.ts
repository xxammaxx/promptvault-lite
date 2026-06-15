// =============================================================================
// Typed Local Action Layer — Public API
// =============================================================================

export {
  dispatch,
  isDeveloperModeEnabled,
  setDeveloperMode,
  setApprovalProvider,
  getApprovalProvider,
} from "./registry";
export type { ApprovalRequest, ApprovalProvider } from "./registry";
export {
  getActionContract,
  ACTION_CONTRACTS,
  VALID_ACTION_NAMES,
} from "./contracts";
export {
  getEvidenceLog,
  getEvidenceByAction,
  getEvidenceSummary,
  clearEvidenceLog,
  hashInput,
  logEvidence,
} from "./evidence";
export {
  setHandlerContext,
  getHandlerContext,
  handleSearch,
  handleGet,
  handleScore,
  handleDetectArtifacts,
  handleOptimize,
  handleCreate,
  handleUpdate,
  handleCollectionsList,
  handleLoadFixture,
  handleCompareScore,
} from "./handlers";
export type { HandlerContext } from "./handlers";
