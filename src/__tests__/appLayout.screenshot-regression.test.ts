import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const appCss = readFileSync(resolve(process.cwd(), "src/App.css"), "utf8");
const appTsx = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8");

function readBlock(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = appCss.match(
    new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`, "m"),
  );
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

  it("has the status bar footer rendered unconditionally in the App shell, even before any folder is loaded", () => {
    // The status bar must NOT be inside any conditional JSX block
    // It is a direct child of .app-container alongside toolbar and <main>
    expect(appTsx).toMatch(/<footer\s+className="app-statusbar"/);
    // The footer must be between the closing </main> and the closing </div> of .app-container
    const mainCloseIdx = appTsx.indexOf("</main>");
    const footerIdx = appTsx.indexOf('className="app-statusbar"');
    const containerCloseIdx = appTsx.indexOf("</div>", footerIdx);

    expect(mainCloseIdx).toBeGreaterThan(0);
    expect(footerIdx).toBeGreaterThan(mainCloseIdx);
    expect(containerCloseIdx).toBeGreaterThan(footerIdx);
  });

  it("prevents viewport-unit clipping by using parent-relative height on .app-container", () => {
    const appContainer = readBlock(".app-container");
    // Must include height: 100% as the last height declaration to match parent #root
    expect(appContainer).toMatch(/height:\s*100%/);
    // The statusbar is flex-shrink: 0 so it never collapses
    const statusBar = readBlock(".app-statusbar");
    expect(statusBar).toMatch(/flex-shrink:\s*0/);
    // #root must have overflow: hidden with height: 100% to clip properly
    const htmlBodyRoot = [
      readBlock("html,\nbody,\n#root"),
      readBlock("html, body, #root"),
    ].join("\n");
    expect(htmlBodyRoot).toMatch(/height:\s*100%/);
    expect(htmlBodyRoot).toMatch(/overflow:\s*hidden/);
  });

  it("verifies the app-layout inner panels are shrink-safe so statusbar cannot be pushed out", () => {
    const appLayout = readBlock(".app-layout");
    const panel = readBlock(".panel");
    const panelContent = readBlock(".panel-content");

    // App-layout must flex-grow into remaining space with min-height:0
    expect(appLayout).toMatch(/flex:\s*1/);
    expect(appLayout).toMatch(/min-height:\s*0/);
    expect(appLayout).toMatch(/overflow:\s*hidden/);

    // Panels inside must also have min-height:0 to prevent overflow
    expect(panel).toMatch(/min-height:\s*0/);
    expect(panelContent).toMatch(/min-height:\s*0/);
  });
});
