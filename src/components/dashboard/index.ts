export * from './KPICard';
export * from './ChartContainer';
// EChartsContainer is deliberately NOT re-exported here. Every tab already imports from this
// barrel for ChartContainer/ConnectedKpiCard/etc., so barrel-exporting it would pull `echarts`
// into the same chunk as the rest of the app for every tab, not just the two that use it.
// Consumers import '{ LazyEChartsContainer }' directly from '@components/dashboard/
// EChartsContainer' instead, which code-splits echarts into its own ~215 KB gzipped chunk that
// only downloads when a user actually opens Cost Analytics or Supply Chain — confirmed via
// `npm run build`: the main chunk is unchanged (+~1 KB gzipped) with this in place.
export * from './DrillDownBreadcrumb';
export * from './AgentSummaryPanel';
export * from './ConversationalInsightsPanel';
export * from './KPILensToggle';
export * from './EarlyWarningStrip';
export * from './ExceptionDetailModal';
export * from './ScenarioNarrativeSections';
export * from './WarningAccordionItem';
export * from './ConfigurationPanel';
export * from './HealthCard';
export * from './ExploreBuilder';
