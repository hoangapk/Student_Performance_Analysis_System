const list = (v) => (Array.isArray(v) ? v : []);

function Block({ title, items }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h4 className="font-semibold">{title}</h4>
      <ul className="mt-1 list-disc space-y-1 pl-5">
        {items.map((t, i) => (
          <li key={i}>{String(t)}</li>
        ))}
      </ul>
    </div>
  );
}

export default function AnalysisCard({ result }) {
  const a = result.analysis || {};
  const recs = list(a.recommendations);
  return (
    <section className="card space-y-4" aria-label="Phân tích bằng AI">
      <div>
        <h3 className="text-lg font-extrabold">Phân tích từ AI</h3>
        <p className="text-sm text-ink/70">
          GPA tích lũy {result.cumulative.gpa4} (thang 4) · {result.cumulative.totalCredits} tín chỉ ·{' '}
          {result.cumulative.classification}
        </p>
      </div>
      {a.overview && <p className="max-w-prose leading-relaxed">{String(a.overview)}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Block title="Điểm mạnh" items={list(a.strengths)} />
        <Block title="Cần cải thiện" items={list(a.weaknesses)} />
        <Block title="Rủi ro cần lưu ý" items={list(a.risks)} />
      </div>
      {recs.length > 0 && (
        <div>
          <h4 className="font-semibold">Việc nên làm tiếp theo</h4>
          <ol className="mt-1 list-decimal space-y-2 pl-5">
            {recs.map((r, i) => (
              <li key={i}>
                <span className="font-medium">{String(r?.title ?? '')}</span>
                {r?.detail ? `: ${String(r.detail)}` : ''}
              </li>
            ))}
          </ol>
        </div>
      )}
      {a.nextSemesterGoal && (
        <p className="rounded bg-paper p-3">
          <span className="font-semibold">Mục tiêu học kỳ tới:</span> {String(a.nextSemesterGoal)}
        </p>
      )}
      <p className="text-xs text-ink/60">
        Phân tích do AI tạo từ điểm bạn nhập, chỉ mang tính gợi ý.
      </p>
    </section>
  );
}
