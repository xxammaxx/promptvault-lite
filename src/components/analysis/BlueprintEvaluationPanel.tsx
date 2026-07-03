import React, { useState } from "react";
import type {
  BlueprintEvaluation,
  BlueprintDimensionScore,
  BlueprintImprovement,
  BlueprintType,
} from "@/types";
import ContentClassBadge from "@/components/common/ContentClassBadge";

// ---- Helpers (reused patterns from AnalysisPanel.tsx) ----

const scoreColor = (score: number) =>
  score >= 70 ? "score-high" : score >= 40 ? "score-medium" : "score-low";

const toFiniteScore = (score: number): number =>
  Number.isFinite(score) ? score : 0;

const scoreColorHex = (score: number) => {
  if (score >= 70) return "var(--color-success)";
  if (score >= 40) return "var(--color-warning)";
  return "var(--color-danger)";
};

const blueprintTypeLabel = (bt: BlueprintType): string => {
  const labels: Record<BlueprintType, string> = {
    architecture_blueprint: "Architecture",
    product_blueprint: "Product",
    implementation_blueprint: "Implementation",
    agent_workflow_blueprint: "Agent Workflow",
    security_blueprint: "Security",
    compliance_blueprint: "Compliance",
    deployment_blueprint: "Deployment",
    generic_blueprint: "Generic",
  };
  return labels[bt];
};

// ---- Reusable sub-components (mirror AnalysisPanel patterns) ----

/** SVG circular score gauge */
const CircularScore: React.FC<{ score: number; size?: number }> = React.memo(
  function CircularScore({ score, size = 80 }) {
    const clamped = Math.min(100, Math.max(0, toFiniteScore(score)));
    const radius = (size - 8) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (clamped / 100) * circumference;
    const color = scoreColorHex(clamped);

    return (
      <div className="circular-score" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="circular-score-svg">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="6"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{
              stroke: color,
              transition: "stroke-dashoffset 0.6s ease, stroke 0.3s ease",
            }}
          />
        </svg>
        <span className={`circular-score-value ${scoreColor(clamped)}`}>
          {clamped}
        </span>
      </div>
    );
  },
);

/** Compact horizontal score bar for 0-100 sub-scores */
const MiniScoreBar: React.FC<{
  label: string;
  score: number;
  title?: string;
}> = React.memo(function MiniScoreBar({ label, score, title }) {
  const clamped = Math.min(100, Math.max(0, toFiniteScore(score)));
  return (
    <div className="context-mini-score" title={title}>
      <span className="context-mini-label">{label}</span>
      <div className="score-bar-track score-bar-track-sm">
        <div
          className={`score-bar-fill ${scoreColor(clamped)}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className={`context-mini-value ${scoreColor(clamped)}`}>
        {clamped}
      </span>
    </div>
  );
});

/** Priority left-border class for improvements */
const priorityClass = (priority: string): string => {
  switch (priority) {
    case "high":
      return "priority-high";
    case "medium":
      return "priority-medium";
    default:
      return "priority-low";
  }
};

// ── Dimension score label mapping ──

const DIMENSION_LABELS: Record<string, string> = {
  goal_clarity_score: "Goal Clarity",
  scope_sharpness_score: "Scope Sharpness",
  architecture_score: "Architecture",
  feasibility_score: "Feasibility",
  risk_coverage_score: "Risk Coverage",
  security_privacy_score: "Security & Privacy",
  testability_score: "Testability",
  evidence_readiness_score: "Evidence Readiness",
  context_purity_score: "Context Purity",
  overall_score: "Overall Score",
};

// ── Component ──

interface BlueprintEvaluationPanelProps {
  evaluation: BlueprintEvaluation | null;
}

export const BlueprintEvaluationPanel: React.FC<
  BlueprintEvaluationPanelProps
> = ({ evaluation }) => {
  const [showAllImprovements, setShowAllImprovements] = useState(false);

  // ----- Null / empty state -----
  if (!evaluation) {
    return null;
  }

  // ----- Sub-score keys (numeric 0-100 fields) -----
  const scoreEntries: [string, number][] = (
    [
      "goal_clarity_score",
      "scope_sharpness_score",
      "architecture_score",
      "feasibility_score",
      "risk_coverage_score",
      "security_privacy_score",
      "testability_score",
      "evidence_readiness_score",
      "context_purity_score",
    ] as (keyof BlueprintEvaluation)[]
  ).map((key) => [key, evaluation[key] as number]);

  // ----- Derived display values -----
  const overallScore = Math.min(
    100,
    Math.max(0, toFiniteScore(evaluation.overall_score)),
  );
  const confidence = Number.isFinite(evaluation.confidence)
    ? evaluation.confidence
    : 0;
  const confidencePct = Math.round(confidence * 100);
  const dimensions: BlueprintDimensionScore[] = evaluation.dimensions;
  const strengths: string[] = evaluation.strengths;
  const warnings: string[] = evaluation.warnings;
  const missingElements: string[] = evaluation.missing_elements;
  const improvements: BlueprintImprovement[] =
    evaluation.suggested_improvements;
  const classificationTags = evaluation.classification_tags ?? [];
  const classificationReasons = evaluation.classification_reasons ?? [];
  const topImprovements = showAllImprovements
    ? improvements
    : improvements.slice(0, 3);
  const totalImprovements = improvements.length;

  const isHybrid = evaluation.content_class === "PROMPT_BLUEPRINT_HYBRID";
  const isPrompt = evaluation.content_class === "PROMPT";
  const isBlueprint = evaluation.content_class === "BLUEPRINT";
  const isGuideline = evaluation.content_class === "GUIDELINE";

  return (
    <div className="blueprint-evaluation-panel">
      {/* ---- Header: classification badges ---- */}
      <div className="blueprint-eval-header">
        <div className="context-badges">
          <ContentClassBadge contentClass={evaluation.content_class} />
          {evaluation.blueprint_type && (
            <span className="badge badge-blueprint">
              {blueprintTypeLabel(evaluation.blueprint_type)}
            </span>
          )}
          <span className="badge badge-tag">{confidencePct}% confidence</span>
        </div>
      </div>

      {(classificationTags.length > 0 || classificationReasons.length > 0) && (
        <div className="analysis-section">
          <h3>Classification</h3>
          <p className="criterion-detail">
            Primary Kind: {evaluation.content_class}
          </p>
          {classificationTags.length > 0 && (
            <div className="context-badges">
              {classificationTags.map((tag) => (
                <span key={tag} className="badge badge-tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
          {classificationReasons.length > 0 && (
            <ul className="blueprint-warnings-list">
              {classificationReasons.map((reason, index) => (
                <li key={index} className="blueprint-warning-item">
                  <span className="blueprint-warning-icon" aria-hidden="true">
                    &#8226;
                  </span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ---- Overall Score ---- */}
      <div className="analysis-section">
        <h3>
          {isBlueprint
            ? "Blueprint Quality Score"
            : isHybrid
              ? "Blueprint Completeness"
              : isGuideline
                ? "Guideline Quality Score"
                : isPrompt
                  ? "Prompt Structure Score"
                  : "Overall Score"}
        </h3>
        <div className="score-display">
          <CircularScore score={overallScore} />
          <span className="score-label">
            {isHybrid
              ? "Completeness"
              : isGuideline
                ? "Guideline"
                : isPrompt
                  ? "Structure"
                  : "Overall"}
          </span>
        </div>
        {isHybrid && (
          <p className="score-context-note">
            This score measures blueprint completeness, not overall prompt
            quality. A low score indicates missing blueprint sections — the
            prompt may still be effective as an agent instruction.
          </p>
        )}
        {isGuideline && (
          <p className="score-context-note">
            This score measures guideline structure and clarity, not task-prompt
            quality. A low role/input score does not indicate a poor guideline —
            guidelines define reusable rules rather than single task prompts.
          </p>
        )}
      </div>

      {/* ---- 9 Sub-Scores ---- */}
      <div className="analysis-section">
        <h3>Dimension Scores</h3>
        <div className="context-scores">
          {scoreEntries.map(([key, val]) => (
            <MiniScoreBar
              key={key}
              label={DIMENSION_LABELS[key] ?? key}
              score={val}
            />
          ))}
        </div>
      </div>

      {/* ---- Detailed Dimension Breakdown ---- */}
      {dimensions.length > 0 && (
        <div className="analysis-section">
          <h3>Detailed Breakdown ({dimensions.length} dimensions)</h3>
          <div className="criteria-list">
            {dimensions.map((dim, index) => (
              <DimensionRow
                key={`${dim.dimension}-${dim.name}-${index}`}
                dimension={dim}
              />
            ))}
          </div>
        </div>
      )}

      {/* ---- Strengths ---- */}
      {strengths.length > 0 && (
        <div className="analysis-section">
          <h3>Strengths ({strengths.length})</h3>
          <ul className="blueprint-strengths-list">
            {strengths.map((s, i) => (
              <li key={i} className="blueprint-strength-item">
                <span className="blueprint-strength-icon" aria-hidden="true">
                  &#10003;
                </span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ---- Warnings ---- */}
      {warnings.length > 0 && (
        <div className="analysis-section">
          <h3>Warnings ({warnings.length})</h3>
          <ul className="blueprint-warnings-list">
            {warnings.map((w, i) => (
              <li key={i} className="blueprint-warning-item">
                <span className="blueprint-warning-icon" aria-hidden="true">
                  &#9888;
                </span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ---- Missing Elements ---- */}
      {missingElements.length > 0 && (
        <div className="analysis-section">
          <h3>Missing Elements ({missingElements.length})</h3>
          <ul className="blueprint-missing-list">
            {missingElements.map((m, i) => (
              <li key={i} className="blueprint-missing-item">
                <span className="blueprint-missing-icon" aria-hidden="true">
                  &#8854;
                </span>
                <span>{m}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ---- Suggested Improvements ---- */}
      {improvements.length > 0 && (
        <div className="analysis-section">
          <h3>Suggested Improvements ({totalImprovements})</h3>
          <ul className="improvements-list">
            {topImprovements.map((imp, i) => (
              <li
                key={`${imp.dimension}-${imp.criterion}-${i}`}
                className={`improvement-item ${priorityClass(imp.priority)}`}
              >
                <span className="improvement-message">{imp.message}</span>
              </li>
            ))}
          </ul>
          {totalImprovements > 3 && !showAllImprovements && (
            <button
              className="btn btn-link"
              onClick={() => {
                setShowAllImprovements(true);
              }}
            >
              Show all {totalImprovements} improvements
            </button>
          )}
          {showAllImprovements && totalImprovements > 3 && (
            <button
              className="btn btn-link"
              onClick={() => {
                setShowAllImprovements(false);
              }}
            >
              Show fewer
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ── Dimension Detail Row ──

const DimensionRow: React.FC<{ dimension: BlueprintDimensionScore }> =
  React.memo(function DimensionRow({ dimension }) {
    const { name, score, max_score, details } = dimension;
    const pct = max_score > 0 ? (score / max_score) * 100 : 0;
    // Map 0-2 score scale to 0-100 for color thresholds
    const color100 = (score / (max_score || 2)) * 100;

    return (
      <div className="criterion-row blueprint-dimension-row">
        <div className="criterion-header">
          <span className="criterion-name">{name}</span>
          <span className={`criterion-score ${scoreColor(color100)}`}>
            {score}/{max_score}
          </span>
        </div>
        <div className="score-bar-track">
          <div
            className={`score-bar-fill ${scoreColor(color100)}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {details && <p className="criterion-detail">{details}</p>}
      </div>
    );
  });

export default BlueprintEvaluationPanel;
