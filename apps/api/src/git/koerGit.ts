// Fælles måde at køre git på: execFile med faste argumenter, aldrig en shell.

import { execFile } from "node:child_process";
import { promisify } from "node:util";

const koerFil = promisify(execFile);
const MAX_BUFFER = 20 * 1024 * 1024;

export async function git(cwd: string, args: string[]): Promise<string> {
  try {
    const { stdout } = await koerFil("git", args, { cwd, maxBuffer: MAX_BUFFER });
    return stdout.trim();
  } catch (fejl) {
    const stderr = (fejl as { stderr?: string }).stderr?.trim();
    throw new Error(`git ${args[0]} fejlede: ${stderr || (fejl as Error).message}`);
  }
}

/** Som git(), men returnerer rå bytes — til filindhold, hvor binære filer skal kunne genkendes */
export async function gitBytes(cwd: string, args: string[]): Promise<Buffer> {
  const { stdout } = await koerFil("git", args, { cwd, maxBuffer: MAX_BUFFER, encoding: "buffer" });
  return stdout;
}
