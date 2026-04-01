export interface StatItem {
  total: number;
  growth?: number;
  trend?: 'up' | 'down' | 'stable';
}

export interface DashboardStats {
  users: StatItem;
  brands: StatItem;
  products: StatItem;
  views: StatItem;
}

export interface DashboardStatsProps {
  stats: DashboardStats;
  loading?: boolean;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
}
