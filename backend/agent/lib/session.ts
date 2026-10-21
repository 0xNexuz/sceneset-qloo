import { defineState } from "eve/context";
import type { CityPulseBrief, CityPulseResult } from "./types";

export interface SceneSession {
  originalBrief?: CityPulseBrief;
  currentBrief?: CityPulseBrief;
  latestResult?: CityPulseResult;
  history: Array<{ query: string; cities: string[]; changed: string[]; qlooCalled: boolean }>;
  investigations: number;
  lastInvestigationTurn?: string;
}

export const sceneSession = defineState<SceneSession>("sceneset.scene-session.v1", () => ({
  history: [], investigations: 0,
}));

export function investigationBudgetError(investigations: number, lastTurnId: string | undefined, turnId: string): string | null {
  if (lastTurnId === turnId) return "Only one city investigation is allowed per turn.";
  if (investigations >= 3) return "This session has used its three Qloo investigations. Start a new search session.";
  return null;
}

export function reserveInvestigation(turnId: string): string | null {
  const state = sceneSession.get();
  const error = investigationBudgetError(state.investigations, state.lastInvestigationTurn, turnId);
  if (error) return error;
  sceneSession.update((current) => ({ ...current, investigations: current.investigations + 1, lastInvestigationTurn: turnId }));
  return null;
}
