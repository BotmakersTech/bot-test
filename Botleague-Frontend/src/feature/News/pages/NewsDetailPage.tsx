import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { getNewsDetail, type NewsResponse } from "../api/news.api";
import planeDecor from "../../../assets/Auth/plane.svg";
import droneDecor from "../../../assets/Auth/drone.svg";
import "../styles/newsDetail.css";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function toLabel(value: string): string {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function readTime(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
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

  const tags = useMemo(() => {
    if (!item) return [];
    const labels = [...item.targetSports, ...item.targetAgeCategories].map(toLabel);
    return labels.length > 0 ? labels : ["Global"];
  }, [item]);

  return (
    <div className="nwd-page">
      <img src={planeDecor} alt="" className="nwd-decor nwd-decor-plane" aria-hidden="true" />
      <img src={droneDecor} alt="" className="nwd-decor nwd-decor-drone" aria-hidden="true" />

      <div className="nwd-shell">
        <Link to="/news" className="nwd-back">
          <ArrowLeft size={15} />
          Back to News
        </Link>

        <p className="nwd-eyebrow">News and Blogs</p>
        <h1 className="nwd-hero-title">From the Arena</h1>
        <div className="nwd-divider" />

        {loading && (
          <div className="nwd-loading">
            <span className="nwd-spinner" aria-hidden="true" />
          </div>
        )}

        {error && <div className="nwd-error">{error}</div>}

        {item && (
          <article className="nwd-article">
            <div className="nwd-tag-row">
              {tags.map((tag) => (
                <span key={tag} className="nwd-tag-pill">{tag}</span>
              ))}
              {item.isPinned && <span className="nwd-pinned-pill">Pinned</span>}
            </div>

            {item.attachmentUrl && (
              <div className="nwd-feature-media">
                {item.attachmentFileType?.startsWith("video/") ? (
                  <video src={item.attachmentUrl} controls />
                ) : (
                  <img src={item.attachmentUrl} alt="" />
                )}
              </div>
            )}

            <h2 className="nwd-title">{item.title}</h2>
            <p className="nwd-meta">
              {formatDate(item.publishedAt)} · {readTime(item.body)} min read
            </p>

            <p className="nwd-body">{item.body}</p>

            <Link to="/news" className="nwd-cta-btn">
              <span>Back to News</span>
              <ArrowRight size={16} />
            </Link>
          </article>
        )}
      </div>
    </div>
  );
}
