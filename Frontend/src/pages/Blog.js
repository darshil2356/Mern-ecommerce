import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BreadCrumb from "../components/BreadCrumb";
import Meta from "../components/Meta";
import Container from "../components/Container";
import { useDispatch, useSelector } from "react-redux";
import { getAllBlogs } from "../features/blogs/blogSlice";
import moment from "moment";

const CATEGORIES = ["All", "Fashion & Trends", "Style Tips", "Wholesale", "AI Generated"];

const BlogCard = ({ blog }) => {
  const clean = (blog.description || "").replace(/<[^>]*>/g, "").replace(/#{1,6}\s/g, "").slice(0, 120) + "...";
  return (
    <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ height: 200, overflow: "hidden", background: "linear-gradient(135deg, #667eea22, #764ba222)", position: "relative" }}>
        {blog.images?.[0]?.url
          ? <img src={blog.images[0].url} alt={blog.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>👗</div>
        }
        {blog.isAI && (
          <span style={{ position: "absolute", top: 12, left: 12, background: "linear-gradient(135deg,#667eea,#764ba2)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>🤖 AI</span>
        )}
      </div>
      <div style={{ padding: 20, flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, background: "#f1f5f9", color: "#667eea", padding: "2px 10px", borderRadius: 20, fontWeight: 600 }}>{blog.category}</span>
          {blog.readTime && <span style={{ fontSize: 11, color: "#94a3b8" }}>⏱ {blog.readTime}</span>}
        </div>
        <h5 style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, marginBottom: 10, lineHeight: 1.4, color: "#1a1a1a", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {blog.title}
        </h5>
        <p style={{ fontSize: 13, color: "#666", lineHeight: 1.7, marginBottom: 14, flex: 1 }}>{clean}</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>{moment(blog.createdAt).format("DD MMM YYYY")}</span>
          <Link to={`/blog/${blog._id}`} style={{ color: "#667eea", fontWeight: 600, fontSize: 13, textDecoration: "none" }}>Read More →</Link>
        </div>
      </div>
    </div>
  );
};

const BLOGS_PER_PAGE = 6;

const Blog = () => {
  const blogState = useSelector((state) => state?.blog?.blog);
  const dispatch = useDispatch();
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => { dispatch(getAllBlogs()); }, []);

  const filtered = (blogState || []).filter(b => {
    const matchCat = activeCategory === "All" || b.category === activeCategory;
    const matchSearch = !search || b.title?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / BLOGS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * BLOGS_PER_PAGE, currentPage * BLOGS_PER_PAGE);

  const handleCategoryChange = (cat) => { setActiveCategory(cat); setCurrentPage(1); };
  const handleSearch = (e) => { setSearch(e.target.value); setCurrentPage(1); };

  return (
    <>
      <Meta
        title="Fashion Blog — Latest Clothing Trends India"
        description="Read the latest fashion tips, style guides, wholesale clothing trends and AI-curated content for Indian shoppers."
        keywords="fashion blog India, clothing trends 2024, wholesale fashion tips, style guide India, AI fashion blog"
        url="/blog"
        schema={{
          "@context": "https://schema.org",
          "@type": "Blog",
          "name": "Yashoda Fashion Blog",
          "description": "Latest fashion trends, style tips and clothing guides for India",
          "url": "https://yashodafashion.in/blog",
          "publisher": { "@type": "Organization", "name": "Yashoda Fashion" }
        }}
      />
      <BreadCrumb title="Fashion Blog" />
      <Container class1="blog-wrapper home-wrapper-2 py-5">
        <div className="row">
          {/* Sidebar */}
          <div className="col-12 col-md-3 mb-4">
            <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 20 }}>
              <h6 style={{ fontWeight: 700, marginBottom: 14, color: "#1a1a2e" }}>🔍 Search</h6>
              <input
                value={search}
                onChange={handleSearch}
                placeholder="Search blogs..."
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, outline: "none" }}
              />
            </div>
            <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <h6 style={{ fontWeight: 700, marginBottom: 14, color: "#1a1a2e" }}>📂 Categories</h6>
              {CATEGORIES.map(cat => (
                <div
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  style={{ padding: "8px 12px", borderRadius: 8, marginBottom: 6, cursor: "pointer", fontSize: 13, fontWeight: activeCategory === cat ? 700 : 400, background: activeCategory === cat ? "linear-gradient(135deg,#667eea,#764ba2)" : "#f8fafc", color: activeCategory === cat ? "#fff" : "#374151", transition: "all 0.2s" }}
                >
                  {cat}
                </div>
              ))}
            </div>
          </div>

          {/* Blog Grid */}
          <div className="col-12 col-md-9">
            {filtered.length === 0
              ? <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>No blogs found.</div>
              : <>
                  <div style={{ marginBottom: 12, fontSize: 13, color: "#94a3b8" }}>
                    Showing {(currentPage - 1) * BLOGS_PER_PAGE + 1}–{Math.min(currentPage * BLOGS_PER_PAGE, filtered.length)} of {filtered.length} blogs
                  </div>
                  <div className="row g-3">
                    {paginated.map(blog => (
                      <div className="col-12 col-sm-6" key={blog._id}>
                        <BlogCard blog={blog} />
                      </div>
                    ))}
                  </div>
                  {totalPages > 1 && (
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 36, flexWrap: "wrap" }}>
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0", background: currentPage === 1 ? "#f8fafc" : "#fff", color: currentPage === 1 ? "#cbd5e1" : "#374151", cursor: currentPage === 1 ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600 }}
                      >
                        ← Prev
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          style={{ width: 36, height: 36, borderRadius: 8, border: "none", background: currentPage === page ? "linear-gradient(135deg,#667eea,#764ba2)" : "#f1f5f9", color: currentPage === page ? "#fff" : "#374151", cursor: "pointer", fontSize: 13, fontWeight: 700 }}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0", background: currentPage === totalPages ? "#f8fafc" : "#fff", color: currentPage === totalPages ? "#cbd5e1" : "#374151", cursor: currentPage === totalPages ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600 }}
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </>
            }
          </div>
        </div>
      </Container>
    </>
  );
};

export default Blog;
