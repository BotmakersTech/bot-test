import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getNewsDetail, type NewsResponse } from "../api/news.api";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function NewsDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<NewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    getNewsDetail(id)
      .then(setItem)
      .catch(() => setError("This News item isn't available."))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link to="/news" className="text-sm text-[#0162D1] hover:underline mb-6 inline-block">
        ← Back to News
      </Link>

      {loading && (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 rounded-full border-2 border-[#0162D1] border-t-transparent animate-spin" />
        </div>
      )}

      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</div>}

      {item && (
        <article>
          {item.isPinned && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0162D1]/10 text-[#0162D1] font-semibold">PINNED</span>
          )}
          <h1 className="text-3xl font-bold text-gray-900 mt-2 mb-2">{item.title}</h1>
          <p className="text-sm text-gray-400 mb-6">{formatDate(item.publishedAt)}</p>

          {item.attachmentUrl && (
            item.attachmentFileType?.startsWith("video/") ? (
              <video src={item.attachmentUrl} controls className="w-full rounded-xl mb-6" />
            ) : (
              <img src={item.attachmentUrl} alt="" className="w-full rounded-xl mb-6" />
            )
          )}

          <p className="text-base text-gray-700 whitespace-pre-wrap leading-relaxed">{item.body}</p>
        </article>
      )}
    </div>
  );
}
