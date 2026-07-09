// =============================================================================
// PromptVault Lite — Missing-Info-Classifier Tests
// =============================================================================

import { describe, it, expect } from "vitest";
import { classify, type ClassificationContext } from "../missingInfoClassifier";
import type { MissingInfoItem } from "@/types";

// =============================================================================
// Helpers
// =============================================================================

function makeItem(
  id: string,
  source: MissingInfoItem["source"],
  label: string,
): MissingInfoItem {
  return {
    id,
    source,
    label,
    question: `Frage ${label}`,
    rationale: `Grund ${label}`,
    inputType: "free_text",
  };
}

// =============================================================================
// classify — Tier Classification
// =============================================================================

describe("classify", () => {
  // --- REQUIRED ---

  it("classifies risk_flag with severity=critical as REQUIRED", () => {
    const items = [makeItem("R1", "risk_flag", "critical_risk")];
    const ctx: Record<string, ClassificationContext> = {
      R1: { source: "risk_flag", riskSeverity: "critical" },
    };
    const result = classify(items, ctx);
    expect(result.items[0].tier).toBe("REQUIRED");
  });

  it("classifies risk_flag with severity=high as REQUIRED", () => {
    const items = [makeItem("R2", "risk_flag", "high_risk")];
    const ctx: Record<string, ClassificationContext> = {
      R2: { source: "risk_flag", riskSeverity: "high" },
    };
    const result = classify(items, ctx);
    expect(result.items[0].tier).toBe("REQUIRED");
  });

  it("classifies PE criterion score=0 on non-simple prompt as REQUIRED", () => {
    const items = [makeItem("P1", "prompt_engineering", "Zielklarheit")];
    const ctx: Record<string, ClassificationContext> = {
      P1: {
        source: "prompt_engineering",
        criterionScore: 0,
        criterionDimension: "prompt_engineering",
        isSimplePrompt: false,
      },
    };
    const result = classify(items, ctx);
    expect(result.items[0].tier).toBe("REQUIRED");
  });

  it("classifies AR criterion score=0 on agentic prompt as REQUIRED", () => {
    const items = [makeItem("A1", "agent_readiness", "Autonomie")];
    const ctx: Record<string, ClassificationContext> = {
      A1: {
        source: "agent_readiness",
        criterionScore: 0,
        isAgenticPrompt: true,
      },
    };
    const result = classify(items, ctx);
    expect(result.items[0].tier).toBe("REQUIRED");
  });

  // --- RECOMMENDED ---

  it("classifies risk_flag with severity=medium as RECOMMENDED", () => {
    const items = [makeItem("R3", "risk_flag", "medium_risk")];
    const ctx: Record<string, ClassificationContext> = {
      R3: { source: "risk_flag", riskSeverity: "medium" },
    };
    const result = classify(items, ctx);
    expect(result.items[0].tier).toBe("RECOMMENDED");
  });

  it("classifies CE criterion score=0 with minimal context as RECOMMENDED", () => {
    const items = [makeItem("C1", "context_engineering", "Kontext")];
    const ctx: Record<string, ClassificationContext> = {
      C1: {
        source: "context_engineering",
        criterionScore: 0,
        isMinimalContext: true,
      },
    };
    const result = classify(items, ctx);
    expect(result.items[0].tier).toBe("RECOMMENDED");
  });

  it("classifies blueprint items as RECOMMENDED", () => {
    const items = [makeItem("B1", "blueprint", "Blueprint-Lücke")];
    const ctx: Record<string, ClassificationContext> = {
      B1: { source: "blueprint" },
    };
    const result = classify(items, ctx);
    expect(result.items[0].tier).toBe("RECOMMENDED");
  });

  it("classifies hygiene items as RECOMMENDED when score < 50", () => {
    const items = [makeItem("H1", "hygiene", "Artefaktbereinigung")];
    const ctx: Record<string, ClassificationContext> = {
      H1: { source: "hygiene", hygieneScore: 30 },
    };
    const result = classify(items, ctx);
    expect(result.items[0].tier).toBe("RECOMMENDED");
  });

  // --- OPTIONAL ---

  it("classifies risk_flag with severity=low as OPTIONAL", () => {
    const items = [makeItem("R4", "risk_flag", "low_risk")];
    const ctx: Record<string, ClassificationContext> = {
      R4: { source: "risk_flag", riskSeverity: "low" },
    };
    const result = classify(items, ctx);
    expect(result.items[0].tier).toBe("OPTIONAL");
  });

  it("classifies PE criterion score=1 as OPTIONAL", () => {
    const items = [makeItem("P2", "prompt_engineering", "Detailgrad")];
    const ctx: Record<string, ClassificationContext> = {
      P2: {
        source: "prompt_engineering",
        criterionScore: 1,
      },
    };
    const result = classify(items, ctx);
    expect(result.items[0].tier).toBe("OPTIONAL");
  });

  it("classifies CE criterion score=1 as OPTIONAL", () => {
    const items = [makeItem("C2", "context_engineering", "Quellen")];
    const ctx: Record<string, ClassificationContext> = {
      C2: {
        source: "context_engineering",
        criterionScore: 1,
      },
    };
    const result = classify(items, ctx);
    expect(result.items[0].tier).toBe("OPTIONAL");
  });

  it("classifies improvements as OPTIONAL", () => {
    const items = [makeItem("I1", "prompt_engineering", "Verbesserung")];
    const ctx: Record<string, ClassificationContext> = {
      I1: { source: "prompt_engineering", improvementPriority: "medium" },
    };
    const result = classify(items, ctx);
    expect(result.items[0].tier).toBe("OPTIONAL");
  });

  // --- Default ---

  it("classifies unknown items as OPTIONAL (default)", () => {
    const items = [makeItem("U1", "prompt_engineering", "Unbekannt")];
    const result = classify(items);
    expect(result.items[0].tier).toBe("OPTIONAL");
    expect(result.items[0].classificationReason).toContain("OPTIONAL");
  });

  // --- Sorting ---

  it("sorts REQUIRED first, then RECOMMENDED, then OPTIONAL", () => {
    const items: MissingInfoItem[] = [
      makeItem("O1", "prompt_engineering", "opt_item"),
      makeItem("R1", "risk_flag", "req_item"),
      makeItem("M1", "risk_flag", "rec_item"),
    ];
    const ctx: Record<string, ClassificationContext> = {
      R1: { source: "risk_flag", riskSeverity: "critical" }, // REQUIRED
      M1: { source: "risk_flag", riskSeverity: "medium" }, // RECOMMENDED
      O1: { source: "risk_flag", riskSeverity: "low" }, // OPTIONAL
    };
    const result = classify(items, ctx);
    expect(result.items[0].tier).toBe("REQUIRED");
    expect(result.items[1].tier).toBe("RECOMMENDED");
    expect(result.items[2].tier).toBe("OPTIONAL");
  });

  // --- Limits ---

  it("limits REQUIRED to max 5", () => {
    const items: MissingInfoItem[] = [];
    const ctx: Record<string, ClassificationContext> = {};
    for (let i = 0; i < 8; i++) {
      const id = `R${i}`;
      items.push(makeItem(id, "risk_flag", `req_${i}`));
      ctx[id] = { source: "risk_flag", riskSeverity: "critical" };
    }
    const result = classify(items, ctx);
    expect(result.items.filter((i) => i.tier === "REQUIRED").length).toBe(5);
    expect(result.requiredOverflow).toBe(3);
  });

  it("limits RECOMMENDED to max 7", () => {
    const items: MissingInfoItem[] = [];
    const ctx: Record<string, ClassificationContext> = {};
    for (let i = 0; i < 10; i++) {
      const id = `M${i}`;
      items.push(makeItem(id, "blueprint", `rec_${i}`));
      ctx[id] = { source: "blueprint" };
    }
    const result = classify(items, ctx);
    expect(result.items.filter((i) => i.tier === "RECOMMENDED").length).toBe(7);
    expect(result.recommendedOverflow).toBe(3);
  });

  it("limits OPTIONAL to max 10", () => {
    const items: MissingInfoItem[] = [];
    for (let i = 0; i < 15; i++) {
      items.push(makeItem(`O${i}`, "prompt_engineering", `opt_${i}`));
    }
    const result = classify(items);
    expect(result.items.filter((i) => i.tier === "OPTIONAL").length).toBe(10);
    expect(result.optionalOverflow).toBe(5);
  });

  it("handles empty array", () => {
    const result = classify([]);
    expect(result.items).toEqual([]);
    expect(result.requiredOverflow).toBe(0);
    expect(result.recommendedOverflow).toBe(0);
    expect(result.optionalOverflow).toBe(0);
  });

  it("classificationReason is set for every item", () => {
    const items = [makeItem("T1", "risk_flag", "test")];
    const ctx: Record<string, ClassificationContext> = {
      T1: { source: "risk_flag", riskSeverity: "critical" },
    };
    const result = classify(items, ctx);
    expect(result.items[0].classificationReason).toBeTruthy();
  });
});
