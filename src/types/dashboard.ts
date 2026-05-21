export type DashboardMetricTone = "indigo" | "emerald" | "amber" | "rose";

export interface DashboardMetric {
  key: string;
  label: string;
  value: number;
  trend: string | null;
  tone: DashboardMetricTone;
}

export interface DashboardFlowPoint {
  date: string;
  name: string;
  inbound: number;
  outbound: number;
}

export type DashboardNoticeType = "error" | "success" | "warning";

export interface DashboardNotice {
  title: string;
  description: string;
  type: DashboardNoticeType;
  time: string;
}

export interface DashboardActivity {
  id: string;
  module: string | null;
  actionType: string | null;
  action: string | null;
  entityName: string | null;
  actorName: string | null;
  createdAt: string;
}

export interface DashboardSummary {
  metrics: DashboardMetric[];
  flow: DashboardFlowPoint[];
  notices: DashboardNotice[];
  recentActivities?: DashboardActivity[];
}
