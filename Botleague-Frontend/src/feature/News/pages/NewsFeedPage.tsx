import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getNewsFeed, type NewsResponse } from "../api/news.api";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function NewsFeedPage() {
  const [items, setItems] = useState<NewsResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const load = async (p: number = 0) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getNewsFeed(p, 20);
      setItems((prev) => (p === 0 ? data.content : [...prev, ...data.content]));
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch {
      setError("Failed to load News.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(0);
  }, []);

  return (
    <div className="mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">News</h1>
      <p className="text-sm text-gray-500 mb-6">Updates from BotLeague, curated for you.</p>

      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">{error}</div>}

      {loading && items.length === 0 && (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 rounded-full border-2 border-[#0162D1] border-t-transparent animate-spin" />
        </div>
      )}

      {!loading && items.length === 0 && !error && (
        <div className="text-center py-16 text-gray-500">Nothing here yet — check back soon.</div>
      )}

      <div className="flex flex-col gap-3">
        {items.map((item) => {
          const isImage = item.attachmentUrl && !item.attachmentFileType?.startsWith("video/");
          return (
            <Link
              key={item.id}
              to={`/news/${item.id}`}
              className="flex gap-4 border border-gray-200 rounded-xl p-5 hover:border-[#0162D1]/40 hover:shadow-sm transition-all bg-white"
            >
              {isImage && (
                <img
                  src={item.attachmentUrl}
                  alt=""
                  className="w-24 h-24 rounded-lg object-cover shrink-0"
                />
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  {item.isPinned && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0162D1]/10 text-[#0162D1] font-semibold">PINNED</span>
                  )}
                  <span className="text-xs text-gray-400">{formatDate(item.publishedAt)}</span>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">{item.title}</h2>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.body}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {items.length > 0 && page < totalPages - 1 && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => load(page + 1)}
            disabled={loading}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? "Loading…" : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
