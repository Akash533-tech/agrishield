export type ScenarioInput = { rainfall: number; temperature: number; severity: number; farmers: number; liquidityMillions: number };
export function calculateScenario(v: ScenarioInput) {
  const climate = Math.max(0, (100 - v.rainfall) * .55 + (v.temperature - 30) * 2 + v.severity * .38);
  const triggered = Math.min(v.farmers, Math.round(v.farmers * climate / 155));
  const payouts = triggered * 8400 * .58;
  const startingCapital = v.liquidityMillions * 1_000_000;
  const remain = Math.max(0, startingCapital - payouts);
  const outstandingReserve = Math.max(1, (v.farmers - triggered) * 8400 * .35);
  return { triggered, payouts, remain, solvency: Math.round(remain / outstandingReserve * 100), loss: Math.round(climate) };
}
