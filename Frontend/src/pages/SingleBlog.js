import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import BreadCrumb from "../components/BreadCrumb";
import Meta from "../components/Meta";
import Container from "../components/Container";
import { useDispatch, useSelector } from "react-redux";
import { getABlog, getAllBlogs } from "../features/blogs/blogSlice";
import moment from "moment";
import { HiOutlineArrowLeft } from "react-icons/hi";

// Render markdown-like content (## headings, ### subheadings, **bold**)
const renderContent = (text = "") => {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("## ")) return <h2 key={i} style={{ fontSize: 22, fontWeight: 700, margin: "28px 0 12px", color: "#1a1a2e", fontFamily: "'Playfair Display', serif" }}>{line.slice(3)}</h2>;
    if (line.startsWith("### ")) return <h3 key={i} style={{ fontSize: 18, fontWeight: 600, margin: "20px 0 10px", color: "#374151" }}>{line.slice(4)}</h3>;
    if (line.startsWith("- ")) return <li key={i} style={{ marginBottom: 6, color: "#374151", lineHeight: 1.8 }}>{line.slice(2).replace(/\*\*(.*?)\*\*/g, "$1")}</li>;
    if (line.trim() === "") return <br key={i} />;
    const bold = line.replace(/\*\*(.*?)\*\*/g, (_, m) => `<strong>${m}</strong>`);
    return <p key={i} style={{ marginBottom: 14, lineHeight: 1.9, color: "#374151", fontSize: 15 }} dangerouslySetInnerHTML={{ __html: bold }} />;
  });
};

const SingleBlog = () => {
  const blogState = useSelector((state) => state?.blog?.singleblog);
  const allBlogs = useSelector((state) => state?.blog?.blog);
  const location = useLocation();
  const getBlogId = location.pathname.split("/")[2];
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getABlog(getBlogId));
    dispatch(getAllBlogs());
    window.scrollTo(0, 0);
  }, [getBlogId]);

  const related = (allBlogs || []).filter(b => b._id !== getBlogId && b.category === blogState?.category).slice(0, 3);
  const siteUrl = "https://www.yashodafashion.com";
  const blogSlug = blogState?.slug || getBlogId;
  const blogUrl = `/blog/${blogSlug}`;

  const articleSchema = blogState ? {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": blogState.title,
    "description": blogState.metaDescription || blogState.description?.replace(/<[^>]+>/g, "").slice(0, 160),
    "image": blogState.images?.[0]?.url || `${siteUrl}/logo512.png`,
    "author": { "@type": "Person", "name": blogState.author || "Admin" },
    "publisher": { "@type": "Organization", "name": "Yashoda Fashion", "logo": { "@type": "ImageObject", "url": `${siteUrl}/logo512.png` } },
    "datePublished": blogState.createdAt,
    "dateModified": blogState.updatedAt || blogState.createdAt,
    "mainEntityOfPage": { "@type": "WebPage", "@id": `${siteUrl}${blogUrl}` },
    "keywords": blogState.keywords || "",
  } : null;

  return (
    <>
      {blogState && (
        <Meta
          title={blogState.metaTitle || blogState.title}
          description={blogState.metaDescription || blogState.description?.replace(/<[^>]+>/g, "").slice(0, 160)}
          keywords={blogState.keywords}
          image={blogState.images?.[0]?.url}
          url={blogUrl}
          type="article"
          schema={articleSchema}
          breadcrumbs={[
            { name: "Blogs", url: "/blogs" },
            { name: blogState.title, url: blogUrl },
          ]}
        />
      )}
      <BreadCrumb
        crumbs={[
          { name: "Blogs", url: "/blogs" },
          { name: blogState?.title || "Blog", url: blogUrl },
        ]}
      />
      <Container class1="blog-wrapper home-wrapper-2 py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-8">
            {/* Back */}
            <Link to="/blog" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#667eea", fontWeight: 600, fontSize: 14, textDecoration: "none", marginBottom: 24 }}>
              <HiOutlineArrowLeft /> Back to Blogs
            </Link>

            {blogState ? (
              <article style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
                {/* Hero Image */}
                <div style={{ height: 320, background: "linear-gradient(135deg,#667eea22,#764ba222)", overflow: "hidden" }}>
                  {blogState.images?.[0]?.url
                    ? <img src={blogState.images[0].url} alt={blogState.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 80 }}>👗</div>
                  }
                </div>

                <div style={{ padding: "32px 36px" }}>
                  {/* Meta row */}
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
                    <span style={{ fontSize: 12, background: "linear-gradient(135deg,#667eea,#764ba2)", color: "#fff", padding: "3px 12px", borderRadius: 20, fontWeight: 600 }}>{blogState.category}</span>
                    {blogState.isAI && <span style={{ fontSize: 12, background: "#f0fdf4", color: "#16a34a", padding: "3px 12px", borderRadius: 20, fontWeight: 600 }}>🤖 AI Generated</span>}
                    {blogState.readTime && <span style={{ fontSize: 12, color: "#94a3b8" }}>⏱ {blogState.readTime}</span>}
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>👁 {blogState.numViews} views</span>
                  </div>

                  {/* Title */}
                  <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 800, lineHeight: 1.3, color: "#1a1a2e", marginBottom: 16 }}>
                    {blogState.title}
                  </h1>

                  {/* Author + Date */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28, paddingBottom: 20, borderBottom: "1px solid #f1f5f9" }}>
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#667eea,#764ba2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14 }}>
                      {(blogState.author || "A")[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e" }}>{blogState.author || "Admin"}</div>
                      <div style={{ fontSize: 12, color: "#94a3b8" }}>{moment(blogState.createdAt).format("DD MMMM YYYY")}</div>
                    </div>
                  </div>

                  {/* Content */}
                  <div style={{ fontSize: 15, lineHeight: 1.9 }}>
                    {renderContent(blogState.description)}
                  </div>

                  {/* Keywords */}
                  {blogState.keywords && (
                    <div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid #f1f5f9" }}>
                      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8, fontWeight: 600 }}>TAGS</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {blogState.keywords.split(",").map((k, i) => (
                          <span key={i} style={{ fontSize: 12, background: "#f8fafc", color: "#667eea", padding: "4px 12px", borderRadius: 20, border: "1px solid #e2e8f0" }}>{k.trim()}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </article>
            ) : (
              <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>Loading...</div>
            )}

            {/* Related Blogs */}
            {related.length > 0 && (
              <div style={{ marginTop: 40 }}>
                <h4 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, marginBottom: 20, color: "#1a1a2e" }}>Related Articles</h4>
                <div className="row g-3">
                  {related.map(b => (
                    <div className="col-12 col-sm-4" key={b._id}>
                      <Link to={`/blog/${b._id}`} style={{ textDecoration: "none" }}>
                        <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                          <div style={{ height: 120, background: "linear-gradient(135deg,#667eea22,#764ba222)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>
                            {b.images?.[0]?.url ? <img src={b.images[0].url} alt={b.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "👗"}
                          </div>
                          <div style={{ padding: 14 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e", margin: 0, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{b.title}</p>
                            <p style={{ fontSize: 11, color: "#94a3b8", margin: "6px 0 0" }}>{moment(b.createdAt).format("DD MMM YYYY")}</p>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Container>
    </>
  );
};

export default SingleBlog;
