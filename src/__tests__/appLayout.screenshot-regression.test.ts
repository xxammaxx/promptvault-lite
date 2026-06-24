import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const appCss = readFileSync(resolve(process.cwd(), "src/App.css"), "utf8");

function readBlock(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = appCss.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`, "m"));
  return match?.[1] ?? "";
}

describe("App shell screenshot regressions", () => {
  it("keeps the main shell on a bounded viewport with a shrink-safe content row", () => {
    const appContainer = readBlock(".app-container");
    const appLayout = readBlock(".app-layout");
    const panel = readBlock(".panel");

    expect(appContainer).toMatch(/100dvh|100vh|height:\s*100%/i);
    expect(appLayout).toMatch(/min-height:\s*0/i);
    expect(panel).toMatch(/min-height:\s*0/i);
  });

  it("keeps the status bar fixed in the flex flow instead of letting content clip it", () => {
    const statusBar = readBlock(".app-statusbar");
    expect(statusBar).toMatch(/flex-shrink:\s*0/i);
  });

  it("keeps optimizer dialogs scrollable without pushing footer controls below the viewport", () => {
    const optimizerBody = readBlock(".optimizer-body");
    const modalDialog = readBlock(".modal-dialog");

    expect(modalDialog).toMatch(/max-height:\s*(80|90)vh/i);
    expect(optimizerBody).toMatch(/min-height:\s*0/i);
  });
});
