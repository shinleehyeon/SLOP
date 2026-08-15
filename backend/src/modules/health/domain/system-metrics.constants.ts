export const SYSTEM_METRIC_IDS = [
  'heap_used',
  'heap_total',
  'rss',
  'system_free_mem',
  'system_total_mem',
  'cpu_system',
  'cpu_process',
  'disk_used',
  'disk_free',
] as const;

export type SystemMetricId = (typeof SYSTEM_METRIC_IDS)[number];

export type SystemMetricUnit = 'bytes' | 'percent';

export const SYSTEM_METRIC_LABELS: Record<SystemMetricId, string> = {
  heap_used: 'Heap 사용량',
  heap_total: 'Heap 할당',
  rss: 'RSS 메모리',
  system_free_mem: '시스템 여유 메모리',
  system_total_mem: '시스템 전체 메모리',
  cpu_system: '시스템 CPU',
  cpu_process: '프로세스 CPU',
  disk_used: '디스크 사용량',
  disk_free: '디스크 여유',
};

export const SYSTEM_METRIC_UNITS: Record<SystemMetricId, SystemMetricUnit> = {
  heap_used: 'bytes',
  heap_total: 'bytes',
  rss: 'bytes',
  system_free_mem: 'bytes',
  system_total_mem: 'bytes',
  cpu_system: 'percent',
  cpu_process: 'percent',
  disk_used: 'bytes',
  disk_free: 'bytes',
};

export const SYSTEM_METRICS_REDIS_PREFIX = 'system:metrics';

export const SYSTEM_METRICS_DISK_PATH = process.platform === 'win32' ? 'C:\\' : '/';
