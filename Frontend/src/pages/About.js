import React, { useState, useEffect } from "react";
import Meta from "../components/Meta";
import BreadCrumb from "../components/BreadCrumb";
import Container from "../components/Container";
import { getPublicSettings } from "../utils/publicSettings";

const About = () => {
  const [storeSettings, setStoreSettings] = useState(null);
  useEffect(() => {
    getPublicSettings().then(setStoreSettings);
  }, []);

  const name = storeSettings?.storeName || "Yashoda Fashion";
  const tagline = storeSettings?.storeTagline || "Your One-Stop Shopping Destination";

  return (
    <>
      <Meta
        title={`About Us | ${name}`}
        description={`Learn about ${name} – a premium women's fashion and clothing store from Ahmedabad. Our story, mission, and values.`}
        keywords="about Yashoda Fashion, fashion brand India, premium clothing brand, our story"
        url="/about"
      />
      <BreadCrumb title="About Us" />
      <Container class1="py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-8">
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2.5rem", marginBottom: "20px" }}>
              About <span style={{ color: "#d4af37" }}>{name}</span>
            </h1>
            <p style={{ color: "#555", lineHeight: 1.9, fontSize: "16px", marginBottom: "20px" }}>
              {name} is a premium fashion and clothing boutique dedicated to bringing you the latest trends, high-quality fabrics, and exclusive designs. We believe fashion is a form of self-expression, and our collections are crafted to help you make a statement.
            </p>
            <p style={{ color: "#555", lineHeight: 1.9, fontSize: "16px", marginBottom: "20px" }}>
              Located in Bapunagar, Ahmedabad, we offer a wide range of stylish and affordable women's wear including kurtis, sarees, suit sets, western wear, tops, pants, and festive collections.
            </p>
            <p style={{ color: "#555", lineHeight: 1.9, fontSize: "16px", marginBottom: "20px" }}>
              Our mission is: {tagline}. We are committed to making premium fashion accessible to everyone across India.
            </p>
            <p style={{ color: "#555", lineHeight: 1.9, fontSize: "16px" }}>
              Thank you for choosing {name}. We are committed to delivering the best shopping experience with quality products, fast delivery, and excellent customer service.
            </p>
          </div>
        </div>
      </Container>
    </>
  );
};

export default About;
