import React from "react";
import Meta from "../components/Meta";
import BreadCrumb from "../components/BreadCrumb";
import Container from "../components/Container";

const About = () => {
  return (
    <>
      <Meta
        title="About Us"
        description="Learn about Yashoda Fashion – a premium fashion and clothing brand from India. Our story, mission, and values."
        keywords="about Yashoda Fashion, fashion brand India, premium clothing brand, our story"
        url="/about"
      />
      <BreadCrumb title="About Us" />
      <Container class1="py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-8">
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2.5rem", marginBottom: "20px" }}>
              About <span style={{ color: "#d4af37" }}>Yashoda Fashion</span>
            </h1>
            <p style={{ color: "#555", lineHeight: 1.9, fontSize: "16px", marginBottom: "20px" }}>
              Yashoda Fashion is a premium fashion and clothing brand dedicated to bringing you the latest trends, high-quality fabrics, and exclusive designs. We believe fashion is a form of self-expression, and our collections are crafted to help you make a statement.
            </p>
            <p style={{ color: "#555", lineHeight: 1.9, fontSize: "16px", marginBottom: "20px" }}>
              From new arrivals to curated bundles, we offer a wide range of clothing for every occasion. Our mission is to make premium fashion accessible to everyone across India.
            </p>
            <p style={{ color: "#555", lineHeight: 1.9, fontSize: "16px" }}>
              Thank you for choosing Yashoda Fashion. We are committed to delivering the best shopping experience with quality products, fast delivery, and excellent customer service.
            </p>
          </div>
        </div>
      </Container>
    </>
  );
};

export default About;
