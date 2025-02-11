import "server-only";

import { ScriptContents } from "@/types/script";
import fs from "fs";
import path from "path";

export async function getCSSContents(
  scriptSlug: string,
): Promise<ScriptContents> {
  try {
    const privateScriptsDirectory = path.join(
      process.cwd(),
      "scripts",
      decodeURIComponent(scriptSlug),
    );

    const privateScriptPath = path.join(privateScriptsDirectory, "css.css");

    const scriptFileContents = fs.readFileSync(privateScriptPath, "utf-8");

    return scriptFileContents;
  } catch (error) {
    console.error("Error reading css:", error);
    return {} as ScriptContents;
  }
}
