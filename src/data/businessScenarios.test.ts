/**
 * Focused pure-function tests for the business-scenario engine.
 *
 * The project has no test runner installed (no vitest/jest config, no `test` script) and adding
 * one was out of scope for this task, so these run directly on Node's built-in type-stripping
 * (Node 22.6+/23.6+) and `node:assert` — no new dependency, no config file:
 *
 *   node src/data/businessScenarios.test.ts
 *
 * Every import above the type-only ones is a relative path so Node can resolve it without the
 * project's `@/*` tsconfig aliases; `KPI`/`ModuleKey` are type-only imports, fully erased by type
 * stripping, so the aliased import in businessScenarios.ts itself never needs runtime resolution.
 */
import assert from 'node:assert';
import {
  classifyAgainstTarget,
  matchBusinessScenario,
  matchBusinessScenariosForModule,
  INVENTORY_DISPATCH_SCENARIOS,
  SALES_PRODUCTION_SCENARIOS,
  IRON_ORE_PRODUCTION_KPI_ID,
  type BusinessScenarioGroup,
} from './businessScenarios.ts';
import type { KPI } from '../types/dashboard.ts';

let passed = 0;
const test = (name: string, fn: () => void) => {
  fn();
  passed += 1;
  console.log(`  ok — ${name}`);
};

const makeKpi = (overrides: Partial<KPI> & Pick<KPI, 'id' | 'current' | 'target'>): KPI => ({
  name: overrides.id,
  module: 'costAnalytics',
  unit: 'units',
  previous: overrides.current,
  percentChange: 0,
  trend: 'flat',
  status: 'good',
  history: [],
  drilldown: { dimension: 'time', root: [] },
  ...overrides,
});

console.log('classifyAgainstTarget');
test('current strictly above target -> aboveTarget', () => {
  assert.strictEqual(classifyAgainstTarget(makeKpi({ id: 'a', current: 10, target: 5 })), 'aboveTarget');
});
test('current below target -> atOrBelowTarget', () => {
  assert.strictEqual(classifyAgainstTarget(makeKpi({ id: 'a', current: 5, target: 10 })), 'atOrBelowTarget');
});
test('current exactly at target -> atOrBelowTarget', () => {
  assert.strictEqual(classifyAgainstTarget(makeKpi({ id: 'a', current: 7, target: 7 })), 'atOrBelowTarget');
});

console.log('matchBusinessScenario — Inventory + Dispatch Cost (all four quadrants)');
const invDispatchCases: Array<{
  label: string;
  inventory: number;
  dispatch: number;
  expectedScenarioId: string;
}> = [
  {
    label: 'high inventory, high dispatch',
    inventory: 100,
    dispatch: 100,
    expectedScenarioId: 'inventory-dispatch-high-high',
  },
  {
    label: 'high inventory, low dispatch',
    inventory: 100,
    dispatch: 50,
    expectedScenarioId: 'inventory-dispatch-high-low',
  },
  {
    label: 'low inventory, high dispatch',
    inventory: 50,
    dispatch: 100,
    expectedScenarioId: 'inventory-dispatch-low-high',
  },
  {
    label: 'low inventory, low dispatch',
    inventory: 50,
    dispatch: 50,
    expectedScenarioId: 'inventory-dispatch-low-low',
  },
];
for (const testCase of invDispatchCases) {
  test(`${testCase.label} -> ${testCase.expectedScenarioId}`, () => {
    const kpis: KPI[] = [
      makeKpi({ id: 'inventory-quantity', current: testCase.inventory, target: 80 }),
      makeKpi({ id: 'dispatch-cost-per-tonne', current: testCase.dispatch, target: 80 }),
    ];
    const match = matchBusinessScenario(INVENTORY_DISPATCH_SCENARIOS, kpis);
    assert.ok(match, 'expected a scenario match');
    assert.strictEqual(match.scenario.id, testCase.expectedScenarioId);
    assert.ok(match.narrative.whatHappened.length > 0);
    assert.ok(match.narrative.recommendedAction.length > 0);
    assert.ok(match.narrative.combined.includes(match.scenario.interpretation));
  });
}

console.log('matchBusinessScenario — Sales + Iron Ore Production is inactive without a real KPI');
test('IRON_ORE_PRODUCTION_KPI_ID is null (no genuine KPI exists in mockData.json)', () => {
  assert.strictEqual(IRON_ORE_PRODUCTION_KPI_ID, null);
});
test('SALES_PRODUCTION_SCENARIOS.secondaryKpiId is wired to IRON_ORE_PRODUCTION_KPI_ID, not a proxy', () => {
  assert.strictEqual(SALES_PRODUCTION_SCENARIOS.secondaryKpiId, IRON_ORE_PRODUCTION_KPI_ID);
});
test('Clean Coal Production does NOT satisfy Iron Ore Production conditions — no match, in any quadrant', () => {
  // Same four (sales, production) combinations that would have matched all four scenarios if
  // Clean Coal Production were (wrongly) treated as Iron Ore Production — every one must now
  // return null instead, regardless of how the numbers line up.
  const combinations: Array<[number, number]> = [
    [50, 50],
    [50, 100],
    [100, 50],
    [100, 100],
  ];
  for (const [sales, production] of combinations) {
    const kpis: KPI[] = [
      makeKpi({ id: 'sale-of-iron-ore', current: sales, target: 80 }),
      makeKpi({ id: 'clean-coal-production', current: production, target: 80 }),
    ];
    const match = matchBusinessScenario(SALES_PRODUCTION_SCENARIOS, kpis);
    assert.strictEqual(match, null, `sales=${sales}, production=${production} must not match`);
  }
});
test('no Sales x Production scenario is returned via matchBusinessScenariosForModule when Iron Ore Production is unavailable', () => {
  const rawMaterialKpis: KPI[] = [
    makeKpi({ id: 'sale-of-iron-ore', current: 100, target: 80, module: 'rawMaterial' }),
    makeKpi({ id: 'clean-coal-production', current: 100, target: 80, module: 'rawMaterial' }),
  ];
  const matches = matchBusinessScenariosForModule('rawMaterial', rawMaterialKpis);
  assert.deepStrictEqual(matches, []);
});
test('TSK Production Volume does NOT satisfy Iron Ore Production either — a different module/subsidiary, not iron-ore-specific', () => {
  // Re-verified during the Tata Steel demo-readiness pass: tsk-production-volume was the only
  // other "production" KPI found anywhere in the repo besides clean-coal-production. It belongs
  // to the `tsk` module (not `rawMaterial`, where sale-of-iron-ore lives) and is a generic
  // subsidiary output metric (Mining/Processing/Logistics business areas), not specific to iron
  // ore — so it must never satisfy this group either, exactly like clean-coal-production.
  const kpis: KPI[] = [
    makeKpi({ id: 'sale-of-iron-ore', current: 100, target: 80, module: 'rawMaterial' }),
    makeKpi({ id: 'tsk-production-volume', current: 100, target: 80, module: 'tsk' }),
  ];
  assert.strictEqual(matchBusinessScenario(SALES_PRODUCTION_SCENARIOS, kpis), null);
  assert.deepStrictEqual(matchBusinessScenariosForModule('rawMaterial', kpis), []);
});
test('the four Sales x Production scenario definitions are still present and intact, just unmatchable', () => {
  const ids = SALES_PRODUCTION_SCENARIOS.scenarios.map((s) => s.id);
  assert.deepStrictEqual(ids, [
    'sales-production-low-low',
    'sales-production-low-high',
    'sales-production-high-low',
    'sales-production-high-high',
  ]);
});
test('reusability: once a real Iron Ore Production KPI id is supplied, the same four scenarios match correctly', () => {
  // Simulates the day a genuine Iron Ore Production KPI is added to mockData.json — a *new*
  // group object pointing at a real (here, synthetic-but-realistic) id, reusing the existing
  // scenario definitions verbatim, proves the engine needs no rewrite: only the id has to change.
  const activatedGroup: BusinessScenarioGroup = {
    ...SALES_PRODUCTION_SCENARIOS,
    secondaryKpiId: 'iron-ore-production',
  };
  const cases: Array<{ sales: number; production: number; expectedScenarioId: string }> = [
    { sales: 50, production: 50, expectedScenarioId: 'sales-production-low-low' },
    { sales: 50, production: 100, expectedScenarioId: 'sales-production-low-high' },
    { sales: 100, production: 50, expectedScenarioId: 'sales-production-high-low' },
    { sales: 100, production: 100, expectedScenarioId: 'sales-production-high-high' },
  ];
  for (const { sales, production, expectedScenarioId } of cases) {
    const kpis: KPI[] = [
      makeKpi({ id: 'sale-of-iron-ore', current: sales, target: 80 }),
      makeKpi({ id: 'iron-ore-production', current: production, target: 80 }),
    ];
    const match = matchBusinessScenario(activatedGroup, kpis);
    assert.ok(match, `expected a match for sales=${sales}, production=${production}`);
    assert.strictEqual(match.scenario.id, expectedScenarioId);
  }
});

console.log('matchBusinessScenario — missing KPI');
test('returns null when a required KPI id is absent from the list', () => {
  const kpis: KPI[] = [makeKpi({ id: 'inventory-quantity', current: 100, target: 80 })];
  assert.strictEqual(matchBusinessScenario(INVENTORY_DISPATCH_SCENARIOS, kpis), null);
});

console.log('matchBusinessScenariosForModule');
test('only matches groups scoped to the requested module', () => {
  const costAnalyticsKpis: KPI[] = [
    makeKpi({ id: 'inventory-quantity', current: 100, target: 80 }),
    makeKpi({ id: 'dispatch-cost-per-tonne', current: 100, target: 80 }),
    // A rawMaterial-scoped KPI id happening to also be present shouldn't cause a cross-module
    // match, since matchBusinessScenariosForModule filters groups by `group.module` first.
    makeKpi({ id: 'sale-of-iron-ore', current: 100, target: 80 }),
  ];
  const matches = matchBusinessScenariosForModule('costAnalytics', costAnalyticsKpis);
  assert.strictEqual(matches.length, 1);
  assert.strictEqual(matches[0]?.group.id, 'inventory-dispatch-cost');
});
test('an unconfigured module returns no matches without throwing', () => {
  const matches = matchBusinessScenariosForModule('procurement', []);
  assert.deepStrictEqual(matches, []);
});

console.log('scenario data integrity');
const groups: BusinessScenarioGroup[] = [INVENTORY_DISPATCH_SCENARIOS, SALES_PRODUCTION_SCENARIOS];
for (const group of groups) {
  test(`${group.label}: exactly 4 scenarios covering all 4 quadrants exactly once`, () => {
    assert.strictEqual(group.scenarios.length, 4);
    const seen = new Set(group.scenarios.map((s) => `${s.conditions.primary}:${s.conditions.secondary}`));
    assert.strictEqual(
      seen.size,
      4,
      'all four (primary, secondary) combinations must be covered exactly once',
    );
  });
  test(`${group.label}: every scenario has a non-empty interpretation and at least one recommended action`, () => {
    for (const scenario of group.scenarios) {
      assert.ok(scenario.interpretation.length > 0, `${scenario.id} missing interpretation`);
      assert.ok(scenario.recommendedActions.length > 0, `${scenario.id} missing recommended actions`);
    }
  });
}

console.log(`\nAll ${passed} assertions passed.`);
