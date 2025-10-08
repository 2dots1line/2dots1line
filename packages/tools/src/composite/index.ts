// packages/tools/src/composite/index.ts
export * from './HolisticAnalysisTool';
export * from './StrategicSynthesisTool';
export * from './FoundationStageTool';
export * from './StrategicStageTool';
// Note: OntologyStageTool exports are excluded to avoid naming conflicts with StrategicStageTool
export { OntologyStageTool, OntologyStageInputSchema, OntologyStageOutputSchema } from './OntologyStageTool'; 