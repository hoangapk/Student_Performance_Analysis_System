import React, { useState, useEffect, useMemo } from 'react';

const list = (v) => (Array.isArray(v) ? v : []);

// 1. Cấu hình theme màu sắc động dựa trên mức GPA
const getGpaTheme = (gpa) => {
  const score = parseFloat(gpa) || 0;
  if (score >= 3.6) {
    return {
      stroke: '#10b981', // Emerald
      glow: 'shadow-emerald-500/20',
      badge: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
      gradient: 'from-emerald-600 via-teal-600 to-cyan-700',
      label: 'Xuất sắc',
    };
  }
  if (score >= 3.2) {
    return {
      stroke: '#6366f1', // Indigo
      glow: 'shadow-indigo-500/20',
      badge: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20',
      gradient: 'from-indigo-600 via-blue-600 to-violet-700',
      label: 'Giỏi',
    };
  }
  if (score >= 2.5) {
    return {
      stroke: '#f59e0b', // Amber
      glow: 'shadow-amber-500/20',
      badge: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
      gradient: 'from-amber-500 via-orange-600 to-red-600',
      label: 'Khá',
    };
  }
  if (score >= 2.0) {
    return {
      stroke: '#f59e0b', // Amber
      glow: 'shadow-amber-500/20',
      badge: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
      gradient: 'from-amber-500 via-orange-600 to-red-600',
      label: 'Trung bình',
    };
  }
  return {
    stroke: '#f43f5e', // Rose
    glow: 'shadow-rose-500/20',
    badge: 'bg-rose-500/10 text-rose-700 border-rose-500/20',
    gradient: 'from-rose-600 via-red-600 to-orange-700',
    label: 'Yếu',
  };
};

// 2. Component Biểu đồ vòng cung GPA động (SVG Radial Gauge)
function GpaRadialGauge({ gpa, maxGpa = 4.0, theme }) {
  const [animatedOffset, setAnimatedOffset] = useState(251.2); // 2 * PI * 40
  const numericGpa = Math.min(Math.max(parseFloat(gpa) || 0, 0), maxGpa);
  const percentage = numericGpa / maxGpa;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedOffset(circumference * (1 - percentage));
    }, 150);
    return () => clearTimeout(timer);
  }, [percentage, circumference]);

  return (
    <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
      <div
        className="absolute inset-2 rounded-full opacity-20 blur-md transition-colors duration-500"
        style={{ backgroundColor: theme.stroke }}
      />
      <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth="8"
          className="text-slate-200/70"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
          stroke={theme.stroke}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={animatedOffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-black tracking-tight text-slate-900">
          {numericGpa.toFixed(2)}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          / {maxGpa.toFixed(1)} GPA
        </span>
      </div>
    </div>
  );
}

// 3. Cấu hình chi tiết cho các nhóm phân tích
const CATEGORY_CONFIG = {
  strengths: {
    key: 'strengths',
    title: 'Điểm mạnh',
    shortTitle: 'Điểm mạnh',
    accent: 'emerald',
    border: 'border-emerald-200/80',
    bg: 'bg-gradient-to-b from-emerald-50/80 to-white',
    badgeBg: 'bg-emerald-100 text-emerald-800',
    iconBg: 'bg-emerald-500 text-white shadow-emerald-200',
    dot: 'bg-emerald-500',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  weaknesses: {
    key: 'weaknesses',
    title: 'Cần cải thiện',
    shortTitle: 'Cải thiện',
    accent: 'amber',
    border: 'border-amber-200/80',
    bg: 'bg-gradient-to-b from-amber-50/80 to-white',
    badgeBg: 'bg-amber-100 text-amber-800',
    iconBg: 'bg-amber-500 text-white shadow-amber-200',
    dot: 'bg-amber-500',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  risks: {
    key: 'risks',
    title: 'Rủi ro cần lưu ý',
    shortTitle: 'Rủi ro',
    accent: 'rose',
    border: 'border-rose-200/80',
    bg: 'bg-gradient-to-b from-rose-50/80 to-white',
    badgeBg: 'bg-rose-100 text-rose-800',
    iconBg: 'bg-rose-500 text-white shadow-rose-200',
    dot: 'bg-rose-500',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
};

export default function AnalysisCard({ result }) {
  const a = result?.analysis || {};
  const cumulative = result?.cumulative || {};
  const gpaTheme = useMemo(() => getGpaTheme(cumulative.gpa4), [cumulative.gpa4]);

  const strengths = useMemo(() => list(a.strengths), [a.strengths]);
  const weaknesses = useMemo(() => list(a.weaknesses), [a.weaknesses]);
  const risks = useMemo(() => list(a.risks), [a.risks]);
  const recs = useMemo(() => list(a.recommendations), [a.recommendations]);

  // State quản lý tab lọc
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'strengths' | 'weaknesses' | 'risks'
  // State quản lý checklist hành động
  const [completedTasks, setCompletedTasks] = useState({});
  // State phản hồi nút copy
  const [copied, setCopied] = useState(false);

  // Key duy nhất dựa trên GPA + tín chỉ để lưu tiến độ checklist vào localStorage
  const storageKey = `ai_study_tasks_${cumulative.gpa4}_${cumulative.totalCredits}`;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setCompletedTasks(JSON.parse(saved));
    } catch {
      // Bỏ qua nếu môi trường chặn localStorage
    }
  }, [storageKey]);

  const toggleTask = (index) => {
    setCompletedTasks((prev) => {
      const next = { ...prev, [index]: !prev[index] };
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  const completedCount = Object.values(completedTasks).filter(Boolean).length;
  const taskProgress = recs.length > 0 ? Math.round((completedCount / recs.length) * 100) : 0;

  // Hàm sao chép toàn bộ báo cáo
  const handleCopyReport = async () => {
    const lines = [
      `📊 PHÂN TÍCH HỌC TẬP TỪ AI`,
      `• GPA tích lũy: ${cumulative.gpa4}/4.0 | ${cumulative.totalCredits} tín chỉ | Xếp loại: ${cumulative.classification || gpaTheme.label}`,
      a.overview ? `\n📝 Tổng quan:\n${a.overview}` : '',
      strengths.length ? `\n✅ Điểm mạnh:\n${strengths.map((s) => `- ${s}`).join('\n')}` : '',
      weaknesses.length ? `\n⚠️ Cần cải thiện:\n${weaknesses.map((w) => `- ${w}`).join('\n')}` : '',
      risks.length ? `\n🚨 Rủi ro cần lưu ý:\n${risks.map((r) => `- ${r}`).join('\n')}` : '',
      recs.length
        ? `\n🎯 Việc nên làm tiếp theo:\n${recs.map((r, i) => `${i + 1}. ${r?.title || ''}: ${r?.detail || ''}`).join('\n')}`
        : '',
      a.nextSemesterGoal ? `\n🚀 Mục tiêu học kỳ tới: ${a.nextSemesterGoal}` : '',
    ].filter(Boolean);

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback nếu không có quyền clipboard
    }
  };

  const blocksData = [
    { config: CATEGORY_CONFIG.strengths, items: strengths },
    { config: CATEGORY_CONFIG.weaknesses, items: weaknesses },
    { config: CATEGORY_CONFIG.risks, items: risks },
  ].filter((b) => b.items.length > 0);

  const visibleBlocks =
    activeTab === 'all' ? blocksData : blocksData.filter((b) => b.config.key === activeTab);

  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xl shadow-slate-200/40"
      aria-label="Phân tích bằng AI"
    >
      {/* Dải màu trang trí trên cùng */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${gpaTheme.gradient}`} />

      {/* PHẦN 1: HERO HEADER & BIỂU ĐỒ GPA */}
      <div className="relative border-b border-slate-100 bg-slate-50/50 p-6 sm:p-8">
        {/* Họa tiết lưới nền mờ */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(#0f172a 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          {/* Cột trái: Tiêu đề & Tổng quan */}
          <div className="space-y-3 lg:max-w-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white shadow-xs">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-400" />
                </span>
                AI Academic Advisor
              </span>
              <span className={`rounded-full border px-3 py-1 text-xs font-bold ${gpaTheme.badge}`}>
                Học lực: {cumulative.classification || gpaTheme.label}
              </span>
            </div>

            <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Báo cáo phân tích lộ trình học tập
            </h3>

            {a.overview && (
              <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                {String(a.overview)}
              </p>
            )}
          </div>

          {/* Cột phải: Thẻ KPI trực quan */}
          <div className="flex items-center justify-between gap-5 rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur-xs sm:justify-start">
            <GpaRadialGauge gpa={cumulative.gpa4} theme={gpaTheme} />

            <div className="space-y-3 pr-2">
              <div>
                <p className="text-xs font-medium text-slate-400">Tín chỉ tích lũy</p>
                <p className="text-xl font-extrabold text-slate-900">
                  {cumulative.totalCredits ?? 0}{' '}
                  <span className="text-xs font-normal text-slate-500">tín chỉ</span>
                </p>
              </div>
              <div className="h-px w-full bg-slate-100" />
              <button
                type="button"
                onClick={handleCopyReport}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-100 active:scale-95"
              >
                {copied ? (
                  <>
                    <svg className="h-3.5 w-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-emerald-700">Đã sao chép</span>
                  </>
                ) : (
                  <>
                    <svg className="h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Sao chép báo cáo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PHẦN 2: BỘ LỌC & MA TRẬN PHÂN TÍCH */}
      <div className="space-y-8 p-6 sm:p-8">
        {blocksData.length > 0 && (
          <div className="space-y-4">
            {/* Thanh điều hướng Tab lọc */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Chẩn đoán chi tiết
              </h4>
              <div className="inline-flex rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    activeTab === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tất cả ({strengths.length + weaknesses.length + risks.length})
                </button>
                {blocksData.map(({ config, items }) => (
                  <button
                    key={config.key}
                    type="button"
                    onClick={() => setActiveTab(config.key)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                      activeTab === config.key
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {config.shortTitle} ({items.length})
                  </button>
                ))}
              </div>
            </div>

            {/* Lưới hiển thị các thẻ phân tích */}
            <div
              className={`grid gap-5 ${
                visibleBlocks.length === 1
                  ? 'grid-cols-1'
                  : visibleBlocks.length === 2
                  ? 'md:grid-cols-2'
                  : 'lg:grid-cols-3'
              }`}
            >
              {visibleBlocks.map(({ config, items }) => (
                <div
                  key={config.key}
                  className={`group flex flex-col justify-between rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${config.border} ${config.bg}`}
                >
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-lg shadow-sm ${config.iconBg}`}
                        >
                          {config.icon}
                        </span>
                        <h5 className="font-bold text-slate-900">{config.title}</h5>
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${config.badgeBg}`}>
                        {items.length}
                      </span>
                    </div>

                    <ul className="space-y-2.5">
                      {items.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-700"
                        >
                          <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${config.dot}`} />
                          <span>{String(item)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PHẦN 3: KẾ HOẠCH HÀNH ĐỘNG TƯƠNG TÁC (INTERACTIVE CHECKLIST) */}
        {recs.length > 0 && (
          <div className="space-y-4">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Kế hoạch hành động đề xuất
                </h4>
                <p className="text-xs text-slate-500">
                  Đánh dấu vào các mục bên dưới để theo dõi tiến độ cải thiện của bạn
                </p>
              </div>

              {/* Thanh tiến độ hoàn thành */}
              <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50 px-3.5 py-2">
                <div className="text-right">
                  <span className="text-xs font-bold text-indigo-600">{taskProgress}%</span>
                  <span className="ml-1 text-xs text-slate-500">
                    ({completedCount}/{recs.length} mục)
                  </span>
                </div>
                <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all duration-500 ease-out"
                    style={{ width: `${taskProgress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-3">
              {recs.map((r, i) => {
                const isDone = !!completedTasks[i];
                return (
                  <div
                    key={i}
                    onClick={() => toggleTask(i)}
                    role="checkbox"
                    aria-checked={isDone}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleTask(i);
                      }
                    }}
                    className={`group flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition-all duration-200 select-none ${
                      isDone
                        ? 'border-emerald-200/80 bg-emerald-50/40'
                        : 'border-slate-200/80 bg-white hover:border-indigo-300 hover:shadow-sm'
                    }`}
                  >
                    {/* Custom Checkbox */}
                    <div
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-all ${
                        isDone
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-slate-300 bg-white text-transparent group-hover:border-indigo-500'
                      }`}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>

                    <div className="flex-1 text-sm leading-relaxed">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-600">BƯỚC {i + 1}</span>
                        {isDone && (
                          <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                            Đã xong
                          </span>
                        )}
                      </div>
                      <p
                        className={`mt-0.5 transition-all ${
                          isDone ? 'text-slate-400 line-through' : 'text-slate-700'
                        }`}
                      >
                        {r?.title && (
                          <strong className={`font-bold ${isDone ? 'text-slate-500' : 'text-slate-900'}`}>
                            {String(r.title)}
                            {r?.detail ? ': ' : ''}
                          </strong>
                        )}
                        {r?.detail && <span>{String(r.detail)}</span>}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PHẦN 4: MỤC TIÊU HỌC KỲ TỚI (DARK SPOTLIGHT CARD) */}
        {a.nextSemesterGoal && (
          <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-6 text-white shadow-lg">
            {/* Hiệu ứng ánh sáng góc */}
            <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-indigo-500/30 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-emerald-500/20 blur-2xl" />

            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-amber-300 ring-1 ring-white/20 backdrop-blur-xs">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">
                    Mục tiêu trọng tâm học kỳ tới
                  </span>
                </div>
                <p className="mt-1.5 text-base font-medium leading-relaxed text-slate-100">
                  {String(a.nextSemesterGoal)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="flex flex-col items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/80 px-6 py-3.5 text-xs text-slate-400 sm:flex-row">
        <div className="flex items-center gap-1.5">
          <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Phân tích do AI tạo tự động từ dữ liệu điểm số, chỉ mang tính chất tham khảo định hướng.</span>
        </div>
        <span className="font-mono text-[11px] text-slate-400">
          {recs.length > 0 ? `Tiến độ: ${taskProgress}%` : 'Sẵn sàng'}
        </span>
      </div>
    </section>
  );
}