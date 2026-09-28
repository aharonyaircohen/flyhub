export type ExecutionTarget =
  | { type: "chat"; id: string }
  | { type: "issue"; id: number }
  | { type: "goal"; id: string }
  | { type: "workflow"; id: string }
  | { type: "loop"; id: string };

export interface EngineExecutionRequest {
  requestId: string;
  target: ExecutionTarget;
  intent: "continue" | "manage" | "run" | "tick";
  source: "dashboard" | "github" | "schedule";
  input?: Record<string, unknown>;
}
