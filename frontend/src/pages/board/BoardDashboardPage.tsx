import { useParams, useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useBoard } from '../../hooks/useBoard';
import { useBoardDashboard } from '../../hooks/useDashboard';

const SERIES_1 = '#2a78d6'; // blue
const SERIES_2 = '#eb6834'; // orange
const GRIDLINE = '#e1e0d9';
const AXIS_TEXT = '#898781';
const AXIS_LINE = '#c3c2b7';

const tooltipStyle = {
  background: '#ffffff',
  border: '1px solid #e4e4e7',
  borderRadius: 12,
  fontSize: 12,
  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
};

function StatTile({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl px-5 py-4">
      <div className="text-2xl font-bold text-zinc-900 leading-none">{value}</div>
      <div className="text-xs font-medium text-zinc-500 mt-1.5">{label}</div>
      {sub && <div className="text-[11px] text-zinc-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-zinc-700 mb-4">{title}</h3>
      {children}
    </div>
  );
}

export default function BoardDashboardPage() {
  const { workspaceId, boardId } = useParams<{ workspaceId: string; boardId: string }>();
  const navigate = useNavigate();
  const { data: board } = useBoard(boardId!);
  const { data: dashboard, isLoading } = useBoardDashboard(boardId!);

  if (isLoading || !dashboard) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-zinc-400">
        불러오는 중...
      </div>
    );
  }

  const lastDay = dashboard.burndown.days[dashboard.burndown.days.length - 1];
  const completionRate =
    dashboard.totalCards > 0 && lastDay
      ? Math.round((lastDay.completed / dashboard.totalCards) * 100)
      : 0;

  return (
    <div className="flex flex-col h-full">
      <nav className="bg-white border-b border-zinc-200 px-6 py-3.5 shrink-0">
        <button
          onClick={() => navigate(`/workspace/${workspaceId}/board/${boardId}`)}
          className="flex items-center gap-1.5 text-sm font-medium text-zinc-500
                     hover:text-zinc-900 transition-colors duration-150 group"
        >
          <svg
            className="w-4 h-4 transition-transform duration-150 group-hover:-translate-x-0.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
          </svg>
          보드로 돌아가기
        </button>
      </nav>

      <div className="flex-1 overflow-auto p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
            {board?.title ?? '보드'} 대시보드
          </h1>
          <p className="mt-1 text-sm text-zinc-500">카드 분포와 진행 현황을 한눈에 확인하세요.</p>
        </div>

        {/* 통계 타일 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatTile label="전체 카드" value={dashboard.totalCards} />
          <StatTile
            label="완료 카드"
            value={lastDay?.completed ?? 0}
            sub={dashboard.burndown.doneColumnTitle ?? undefined}
          />
          <StatTile label="완료율" value={`${completionRate}%`} />
          <StatTile label="컬럼 수" value={dashboard.columnDistribution.length} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* 컬럼별 카드 분포 */}
          <ChartCard title="컬럼별 카드 분포">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={dashboard.columnDistribution} barCategoryGap="30%">
                <CartesianGrid stroke={GRIDLINE} vertical={false} />
                <XAxis
                  dataKey="title"
                  tick={{ fontSize: 12, fill: AXIS_TEXT }}
                  axisLine={{ stroke: AXIS_LINE }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: AXIS_TEXT }}
                  axisLine={{ stroke: AXIS_LINE }}
                  tickLine={false}
                  width={28}
                />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                <Bar dataKey="count" name="카드 수" fill={SERIES_1} radius={[4, 4, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 담당자별 카드 분포 */}
          <ChartCard title="담당자별 카드 분포">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={dashboard.assigneeDistribution} barCategoryGap="30%">
                <CartesianGrid stroke={GRIDLINE} vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: AXIS_TEXT }}
                  axisLine={{ stroke: AXIS_LINE }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: AXIS_TEXT }}
                  axisLine={{ stroke: AXIS_LINE }}
                  tickLine={false}
                  width={28}
                />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                <Bar dataKey="count" name="카드 수" fill={SERIES_1} radius={[4, 4, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* 번다운 차트 */}
        <ChartCard
          title={`번다운 (최근 14일 · "${dashboard.burndown.doneColumnTitle ?? '마지막 컬럼'}" 기준)`}
        >
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={dashboard.burndown.days}>
              <CartesianGrid stroke={GRIDLINE} vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: AXIS_TEXT }}
                axisLine={{ stroke: AXIS_LINE }}
                tickLine={false}
                tickFormatter={d => d.slice(5)}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: AXIS_TEXT }}
                axisLine={{ stroke: AXIS_LINE }}
                tickLine={false}
                width={28}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="opened"
                name="누적 생성"
                stroke={SERIES_1}
                strokeWidth={2}
                dot={{ r: 4, fill: SERIES_1, strokeWidth: 0 }}
                activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="completed"
                name="누적 완료"
                stroke={SERIES_2}
                strokeWidth={2}
                dot={{ r: 4, fill: SERIES_2, strokeWidth: 0 }}
                activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
