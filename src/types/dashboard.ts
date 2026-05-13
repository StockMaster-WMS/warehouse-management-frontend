export interface DashboardMetric {
  id: string;
  label: string;
  value: string | number;
  trend?: string;
  color?: string;
}

export interface RecentActivity {
  module: string;
  actionType: string;
  action: string;
  entityName?: string;
  actorName: string;
  createdAt: string;
}

export interface FlowData {
  date: string;
  inbound: number;
  outbound: number;
}

export interface DashboardNotice {
  title: string;
  desc: string;
  type: "error" | "success" | "warning";
  time: string;
}

export interface DashboardSummary {
  metrics: DashboardMetric[];
  recentActivities: RecentActivity[];
  flow: FlowData[];
  notices: DashboardNotice[];
}
