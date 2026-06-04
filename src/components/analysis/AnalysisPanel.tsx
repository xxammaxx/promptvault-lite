import React from "react";
import { useAppStore } from "@/stores/appStore";

const scoreColor = (score: number) =>
  score >= 70 ? "score-high" : score >= 40 ? "score-medium" : "score-low";

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
            <div
              className={`score-big ${scoreColor(evaluation.overall_score)}`}
            >
              {evaluation.overall_score}
              <span className="score-unit">/100</span>
            </div>

            <div className="criteria-list">
              {evaluation.criteria.map((c) => (
                <div key={c.name} className="criterion-row">
                  <div className="criterion-header">
                    <span className="criterion-name">{c.name}</span>
                    <span
                      className={`criterion-score ${scoreColor(c.score * 10)}`}
                    >
                      {c.score}/10
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
              <span
                className={`score-big ${scoreColor(hygiene.hygiene_score)}`}
              >
                {hygiene.hygiene_score}
                <span className="score-unit">/100</span>
              </span>
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
                      {a.severity === "critical" && "🔴"}
                      {a.severity === "warning" && "⚠️"}
                      {a.severity === "info" && "ℹ️"}
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
