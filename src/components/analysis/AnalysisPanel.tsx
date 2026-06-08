import React from "react";
import { useAppStore } from "@/stores/appStore";

const scoreColor = (score: number) =>
  score >= 70 ? "score-high" : score >= 40 ? "score-medium" : "score-low";

const scoreColorHex = (score: number) => {
  if (score >= 70) return "var(--color-success)";
  if (score >= 40) return "var(--color-warning)";
  return "var(--color-danger)";
};

/** SVG circular score gauge */
const CircularScore: React.FC<{ score: number; size?: number }> = React.memo(
  function CircularScore({ score, size = 90 }) {
    const radius = (size - 8) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const color = scoreColorHex(score);

    return (
      <div className="circular-score" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="circular-score-svg">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="6"
          />
          {/* Score arc */}
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
        <span className={`circular-score-value ${scoreColor(score)}`}>
          {score}
        </span>
      </div>
    );
  },
);

export const AnalysisPanel: React.FC = () => {
  const prompt = useAppStore((s) => s.selectedPrompt)();
  const evaluation = useAppStore((s) => s.selectedEvaluation)();
  const hygiene = useAppStore((s) => s.selectedHygiene)();
  const isAnalyzing = useAppStore((s) => s.isAnalyzing);
  const analyzeSelected = useAppStore((s) => s.analyzeSelected);

  if (!prompt) {
    return (
      <div className="panel panel-analysis">
        <div className="panel-header">Analyse</div>
        <div className="panel-content">
          <div className="empty-state">
            <p>Keine Analyse verfügbar.</p>
            <p className="hint">
              Wähle einen Prompt und klicke auf »Analysieren«.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="panel panel-analysis">
        <div className="panel-header">Analyse</div>
        <div className="panel-content">
          <div className="loading-state">
            <div className="spinner" />
            <p>Analysiere...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!evaluation && !hygiene) {
    return (
      <div className="panel panel-analysis">
        <div className="panel-header">Analyse</div>
        <div className="panel-content">
          <div className="empty-state">
            <p>Noch nicht analysiert.</p>
            <button
              className="btn btn-primary"
              onClick={() => {
                void analyzeSelected();
              }}
            >
              Jetzt analysieren
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="panel panel-analysis">
      <div className="panel-header">Analyse</div>
      <div className="panel-content">
        {/* Qualitäts-Score */}
        {evaluation && (
          <div className="analysis-section">
            <h3>Qualitätsanalyse</h3>
            <div className="score-display">
              <CircularScore score={evaluation.overall_score} />
              <span className="score-label">Gesamtwertung</span>
            </div>

            <div className="criteria-list">
              {evaluation.criteria.map((c) => (
                <div key={c.name} className="criterion-row">
                  <div className="criterion-header">
                    <span className="criterion-name">{c.name}</span>
                    <span
                      className={`criterion-score ${scoreColor(c.score * 10)}`}
                    >
                      {c.score}/{c.max_score}
                    </span>
                  </div>
                  <div className="score-bar-track">
                    <div
                      className={`score-bar-fill ${scoreColor(c.score * 10)}`}
                      style={{ width: `${(c.score / c.max_score) * 100}%` }}
                    />
                  </div>
                  <p className="criterion-detail">{c.details}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hygiene-Score */}
        {hygiene && (
          <div className="analysis-section">
            <h3>Hygieneanalyse</h3>
            <div className="hygiene-status">
              <span className={`hygiene-badge hygiene-${hygiene.status}`}>
                {hygiene.status === "clean" && "✅ Sauber"}
                {hygiene.status === "warning" && "⚠️ Warnung"}
                {hygiene.status === "critical" && "🔴 Kritisch"}
              </span>
              <CircularScore score={hygiene.hygiene_score} size={80} />
            </div>

            {hygiene.artifacts.length > 0 && (
              <div className="artifact-list">
                <h4>Gefundene Artefakte ({hygiene.artifacts.length})</h4>
                {hygiene.artifacts.map((a) => (
                  <div
                    key={a.id}
                    className={`artifact-item severity-${a.severity}`}
                  >
                    <span className="artifact-category">{a.category}</span>
                    <span className="artifact-severity">
                      {a.severity === "critical" && (
                        <span aria-hidden="true">🔴</span>
                      )}
                      {a.severity === "warning" && (
                        <span aria-hidden="true">⚠️</span>
                      )}
                      {a.severity === "info" && (
                        <span aria-hidden="true">ℹ️</span>
                      )}
                    </span>
                    <span className="artifact-match">{a.match}</span>
                    {a.replacement_suggestion && (
                      <span className="artifact-replacement">
                        → {a.replacement_suggestion}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empfehlungen */}
        {evaluation && evaluation.recommendations.length > 0 && (
          <div className="analysis-section">
            <h3>Empfehlungen</h3>
            <ol className="recommendations-list">
              {evaluation.recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
};
