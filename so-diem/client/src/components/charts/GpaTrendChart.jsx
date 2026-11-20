import {
  Area,
  CartesianGrid,
  ComposedChart,
  LabelList,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const fmt2 = (v) => (typeof v === 'number' && !Number.isNaN(v) ? v.toFixed(2) : '--');

function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload || {};
  return (
    <div className="rounded-md border border-rule bg-white px-3 py-2 text-sm shadow-sheet">
      <p className="font-semibold">{label}</p>
      <p className="num text-pine">GPA học kỳ: {fmt2(row.gpa4)}</p>
      <p className="num text-pen">GPA tích lũy: {fmt2(row.cumGpa4)}</p>
      <p className="num text-mute">
        {row.credits ?? 0} tín chỉ · TB {fmt2(row.gpa10)}/10
      </p>
    </div>
  );
}

function renderSemesterLabel(props) {
  const { x, y, value, index, payload } = props;
  if (typeof value !== 'number' || Number.isNaN(value) || x == null || y == null) return null;
  const sameAsCum =
    payload && typeof payload.cumGpa4 === 'number' && Math.abs(payload.cumGpa4 - value) < 0.01;
  const dy = index === 0 && sameAsCum ? -14 : -10;
  return (
    <text x={x} y={y + dy} textAnchor="middle" fontSize={11} fontWeight={700} fill="#2B59C3">
      {value.toFixed(2)}
    </text>
  );
}

function renderCumLabel(props) {
  const { x, y, value, index, payload } = props;
  if (typeof value !== 'number' || Number.isNaN(value) || x == null || y == null) return null;
  const sameAsSem =
    payload && typeof payload.gpa4 === 'number' && Math.abs(payload.gpa4 - value) < 0.01;
  const dy = index === 0 && sameAsSem ? 18 : -10;
  return (
    <text x={x} y={y + dy} textAnchor="middle" fontSize={11} fontWeight={600} fill="#D7263D">
      {value.toFixed(2)}
    </text>
  );
}

const tick = { fontSize: 12, fill: '#5B6B8A' };

export default function GpaTrendChart({ data }) {
  const rows = Array.isArray(data) ? data : [];

  if (!rows.length) {
    return (
      <div className="flex h-72 w-full items-center justify-center text-sm text-mute">
        Chưa có dữ liệu xu hướng GPA theo học kỳ.
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ top: 20, right: 16, bottom: 4, left: -16 }}>
          <defs>
            <linearGradient id="gpaSemAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2B59C3" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#2B59C3" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#DCE8F8" vertical={false} />
          <XAxis
            dataKey="name"
            tick={tick}
            tickLine={false}
            axisLine={{ stroke: '#CFE0F5' }}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 4]}
            ticks={[0, 1, 2, 3, 4]}
            tick={tick}
            tickLine={false}
            axisLine={false}
          />
          <ReferenceLine
            y={3.2}
            stroke="#1F7A4D"
            strokeDasharray="4 4"
            label={{ value: 'Giỏi 3.2', position: 'insideTopRight', fontSize: 11, fill: '#1F7A4D' }}
          />
          <ReferenceLine
            y={2.5}
            stroke="#C28A1B"
            strokeDasharray="4 4"
            label={{ value: 'Khá 2.5', position: 'insideTopRight', fontSize: 11, fill: '#C28A1B' }}
          />
          <Tooltip content={<TrendTooltip />} />
          <Legend verticalAlign="top" height={28} iconType="plainline" wrapperStyle={{ fontSize: 12 }} />
          <Area
            type="monotone"
            dataKey="gpa4"
            name="GPA học kỳ"
            stroke="#2B59C3"
            strokeWidth={3}
            fill="url(#gpaSemAreaGrad)"
            dot={{ r: 4.5, fill: '#fff', stroke: '#2B59C3', strokeWidth: 2 }}
            activeDot={{ r: 6.5, fill: '#2B59C3', stroke: '#fff', strokeWidth: 2 }}
          >
            <LabelList dataKey="gpa4" content={renderSemesterLabel} />
          </Area>
          <Line
            type="monotone"
            dataKey="cumGpa4"
            name="GPA tích lũy"
            stroke="#D7263D"
            strokeWidth={2.5}
            strokeDasharray="6 4"
            dot={{ r: 3.5, fill: '#D7263D', stroke: '#fff', strokeWidth: 1.5 }}
            activeDot={{ r: 5.5, fill: '#D7263D', stroke: '#fff', strokeWidth: 2 }}
          >
            <LabelList dataKey="cumGpa4" content={renderCumLabel} />
          </Line>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}