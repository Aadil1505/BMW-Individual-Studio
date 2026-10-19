export type RenderParams = Record<string, string>;
export interface View {
  id: string;
  label: string;
  field: string;
  rotatable: boolean;
  params: RenderParams;
  frames?: RenderParams[];
}
export interface CatalogModel {
  modelRange: string;
  typeCode: string;
  localizedName?: Record<string, string>;
}
export interface Paint {
  p0ID: string;
  localizedName?: Record<string, string>;
  effect?: string;
  mainColor?: string;
  hexCode?: string;
}
export interface SummaryItem {
  code: string;
  name: string;
}
export interface Build {
  errorCode: number;
  model: {
    year: string | number;
    name: string;
    code: string;
    modelRange?: string;
  };
  configuration: {
    modelRange?: string;
    cosy: Record<string, string | string[]>;
    summary?: { exterior?: SummaryItem[]; interior?: SummaryItem[] };
  };
}
export interface ImportedBuild {
  code: string;
  build: Build;
  views: View[];
  candidates: CatalogModel[];
  catalogError?: string;
  originalName: string;
}
export interface RequestLog {
  id: number;
  label: string;
  url: string;
  status?: number;
  ms: number;
  error?: string;
}
export interface DisplayedRender {
  viewId: string;
  url: string;
  paint: string;
  name: string;
  view: string;
  lighting: string;
  angle?: number;
  params: RenderParams;
  width: number;
  height: number;
}
