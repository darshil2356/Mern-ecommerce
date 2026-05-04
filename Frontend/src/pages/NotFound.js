import { Link } from "react-router-dom";
import Meta from "../components/Meta";

const NotFound = () => {
  return (
    <>
      <Meta
        title="Page Not Found"
        description="The page you are looking for does not exist. Browse our latest fashion collection at Yashoda Fashion."
        url="/404"
      />
      <main
        style={{
          minHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px",
          fontFamily: "'Inter', sans-serif",
          background: "#fafafa",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(6rem, 18vw, 10rem)",
            fontWeight: 700,
            color: "#1a1a1a",
            margin: 0,
            lineHeight: 1,
          }}
        >
          404
        </p>
        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(1.4rem, 4vw, 2rem)",
            fontWeight: 600,
            color: "#1a1a1a",
            margin: "16px 0 12px",
          }}
        >
          Page Not Found
        </h1>
        <p
          style={{
            fontSize: "1rem",
            color: "#666",
            maxWidth: "420px",
            lineHeight: 1.6,
            margin: "0 0 36px",
          }}
        >
          The page you're looking for has been moved, deleted, or never existed.
          Let's get you back to something fabulous.
        </p>

        <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", justifyContent: "center" }}>
          <Link
            to="/"
            style={{
              background: "linear-gradient(135deg,#d4af37,#f0c94d)",
              color: "#1a1a1a",
              padding: "13px 30px",
              borderRadius: "4px",
              fontWeight: 800,
              fontSize: "12px",
              textTransform: "uppercase",
              letterSpacing: "2px",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Go Home
          </Link>
          <Link
            to="/product"
            style={{
              background: "transparent",
              color: "#1a1a1a",
              padding: "12px 28px",
              borderRadius: "4px",
              fontWeight: 700,
              fontSize: "12px",
              textTransform: "uppercase",
              letterSpacing: "2px",
              textDecoration: "none",
              border: "1.5px solid rgba(26,26,26,0.4)",
              display: "inline-block",
            }}
          >
            Browse Products
          </Link>
        </div>

        <div
          style={{
            marginTop: "56px",
            display: "flex",
            gap: "32px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {[
            { label: "New Arrivals", to: "/product?tag=featured" },
            { label: "Blogs", to: "/blogs" },
            { label: "Contact Us", to: "/contact" },
          ].map((link) => (
            <Link
              key={link.to}
              to={link.to}
              style={{
                color: "#d4af37",
                fontWeight: 600,
                fontSize: "14px",
                textDecoration: "underline",
                textUnderlineOffset: "3px",
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </main>
    </>
  );
};

export default NotFound;
