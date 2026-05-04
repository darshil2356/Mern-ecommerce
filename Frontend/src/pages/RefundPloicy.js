import React from "react";
import BreadCrumb from "../components/BreadCrumb";
import Meta from "../components/Meta";
import Container from "../components/Container";
import { motion } from "framer-motion";

const Section = ({ title, children }) => (
  <>
    <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", marginBottom: "15px", marginTop: "35px", color: "#1a1a1a" }}>
      {title}
    </h4>
    {children}
  </>
);

const P = ({ children }) => (
  <p style={{ color: "#555", lineHeight: 1.9, marginBottom: "16px", fontSize: "15px" }}>{children}</p>
);

const UL = ({ items }) => (
  <ul style={{ color: "#555", lineHeight: 2.1, paddingLeft: "22px", marginBottom: "20px", fontSize: "15px" }}>
    {items.map((item, i) => <li key={i}>{item}</li>)}
  </ul>
);

// ── Highlight box used for Google-required summary at top ──────────────────
const InfoBox = ({ color, children }) => (
  <div style={{
    background: color === "green" ? "#f0fdf4" : color === "yellow" ? "#fffbeb" : "#fff7ed",
    border: `1px solid ${color === "green" ? "#bbf7d0" : color === "yellow" ? "#fde68a" : "#fed7aa"}`,
    borderRadius: "12px", padding: "20px 24px", marginBottom: "16px"
  }}>
    {children}
  </div>
);

const RefundPloicy = () => {
  return (
    <>
      <Meta
        title="Return & Refund Policy | Yashoda Fashion"
        description="Yashoda Fashion return and refund policy. Returns accepted within 7 days of delivery. Refunds issued as store credit (Yashoda Coins). Free return shipping on defective items."
        keywords="return policy, refund policy, exchange policy, Yashoda Fashion returns, store credit, coin refund, 7 day return"
        url="/refund-policy"
      />
      <BreadCrumb title="Return & Refund Policy" />

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)", padding: "60px 0", marginTop: "-1px" }}>
        <Container>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "3rem", color: "#fff", marginBottom: "10px" }}>
              Return & <span style={{ color: "#d4af37" }}>Refund Policy</span>
            </h1>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "16px" }}>
              7-day returns · Store credit refunds · Free return on defective items
            </p>
          </motion.div>
        </Container>
      </div>

      <Container className="py-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div style={{ background: "#fff", borderRadius: "16px", padding: "40px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
            <div style={{ maxWidth: "800px", margin: "0 auto" }}>

              <P>Last updated: {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</P>

              {/* ── Google Merchant Quick Summary ── */}
              <div style={{ background: "#f8f9ff", border: "2px solid #e0e7ff", borderRadius: "14px", padding: "24px", marginBottom: "32px" }}>
                <p style={{ fontWeight: "700", fontSize: "16px", color: "#1a1a1a", marginBottom: "16px" }}>📋 Policy Summary (Quick Reference)</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  {[
                    ["Return Window",       "7 days from delivery date"],
                    ["Return Method",       "By post (courier) or in-store visit"],
                    ["Return Shipping",     "Free for defective/wrong items · Customer pays for other returns"],
                    ["Refund Type",         "Store credit (Yashoda Coins) — no cash refunds"],
                    ["Refund Timeline",     "Coins credited within 2–3 business days of return approval"],
                    ["Exchange",            "Available for size/colour issues within 7 days"],
                    ["Condition Required",  "Unused, unwashed, original tags intact"],
                    ["Contact",             "info@yashodafashion.com · +91 70462 52356"],
                  ].map(([label, value]) => (
                    <div key={label} style={{ background: "#fff", borderRadius: "8px", padding: "12px 14px", border: "1px solid #e5e7eb" }}>
                      <p style={{ fontSize: "11px", color: "#6b7280", marginBottom: "3px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</p>
                      <p style={{ fontSize: "14px", color: "#111827", fontWeight: "600", margin: 0 }}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 1 */}
              <Section title="1. Return Window">
                <P>
                  You may request a return within <strong>7 days of the delivery date</strong>. Requests raised after 7 days from the date of delivery will not be accepted. The delivery date is determined by the tracking information provided by our shipping partner (Shiprocket).
                </P>
              </Section>

              {/* 2 */}
              <Section title="2. How to Return — Return Method">
                <P>We accept returns through two methods:</P>
                <UL items={[
                  "By Post / Courier — Ship the item back to our address using any courier service. We will arrange a reverse pickup for defective or wrong items at no cost to you.",
                  "In-Store — Visit our store atShop no. 1-2 Greendhara apartment, Near bhagawati school, India Colony, Bapunagar, Ahmedabad, Gujarat 382350 with the item and your order ID.",
                ]} />
                <P>
                  To initiate a return, contact us at <a href="mailto:info@yashodafashion.com" style={{ color: "#d4af37" }}>info@yashodafashion.com</a> or <a href="tel:+917046252356" style={{ color: "#d4af37" }}>+91 70462 52356</a> with your order ID and reason for return. We will confirm the return within 1 business day.
                </P>
              </Section>

              {/* 3 */}
              <Section title="3. Return Shipping Cost">
                <InfoBox color="green">
                  <p style={{ margin: 0, fontSize: "15px", color: "#166534" }}>
                    ✅ <strong>Defective, damaged, or wrong item received:</strong> We arrange free reverse pickup. No cost to you.
                  </p>
                </InfoBox>
                <InfoBox color="yellow">
                  <p style={{ margin: 0, fontSize: "15px", color: "#92400e" }}>
                    ⚠️ <strong>Size exchange or change of mind:</strong> Customer is responsible for return shipping charges.
                  </p>
                </InfoBox>
              </Section>

              {/* 4 */}
              <Section title="4. Refund Method — Store Credit (Yashoda Coins)">
                <P>
                  Yashoda Fashion does <strong>not offer cash refunds or bank transfers</strong>. All approved refunds are issued as <strong>Yashoda Coins</strong> (store credit) credited to your account wallet. This applies to all payment methods including Razorpay, UPI, and card payments.
                </P>
                <UL items={[
                  "1 Yashoda Coin = ₹1 store credit",
                  "Coins are credited within 2–3 business days after return is approved and item is received",
                  "Coins never expire and remain in your account until used",
                  "Coins can be applied at checkout to reduce the payable amount on any future order",
                  "Coins can be combined with coupon codes and active offers",
                ]} />
              </Section>

              {/* 5 */}
              <Section title="5. Exchange Policy">
                <P>
                  We offer <strong>free size and colour exchanges</strong> within 7 days of delivery, subject to stock availability. To request an exchange:
                </P>
                <UL items={[
                  "Contact us within 7 days of delivery with your order ID and the size/colour you need",
                  "Ship the original item back (customer pays return shipping for exchanges)",
                  "Once we receive and inspect the item, we dispatch the replacement within 2–3 business days",
                  "If the requested size/colour is unavailable, a full coin refund will be issued",
                ]} />
              </Section>

              {/* 6 */}
              <Section title="6. Conditions for Return Eligibility">
                <P>To be eligible for a return or exchange, the item must meet all of the following conditions:</P>
                <UL items={[
                  "Return request raised within 7 days of delivery",
                  "Item is unused, unworn, and unwashed",
                  "Original tags and labels are intact and attached",
                  "Item is in its original packaging",
                  "Proof of purchase (order ID) is provided",
                  "Item is not from a non-returnable category (see Section 7)",
                ]} />
              </Section>

              {/* 7 */}
              <Section title="7. Non-Returnable Items">
                <P>The following items are <strong>not eligible</strong> for return, exchange, or refund:</P>
                <UL items={[
                  "Items that have been worn, washed, altered, or damaged by the customer",
                  "Items purchased during final sale or clearance events (marked as non-returnable at time of purchase)",
                  "Free gift items received as part of a bundle or promotional offer",
                  "Items without original tags, labels, or packaging",
                  "Innerwear, lingerie, and swimwear (for hygiene reasons)",
                  "Customised or made-to-order items",
                ]} />
              </Section>

              {/* 8 */}
              <Section title="8. Defective or Damaged Items">
                <P>
                  If you receive a <strong>defective, damaged, or wrong item</strong>, please contact us within <strong>48 hours of delivery</strong> with:
                </P>
                <UL items={[
                  "Your order ID",
                  "Clear photos of the defect or damage",
                  "Photo of the shipping label",
                ]} />
                <P>
                  We will arrange a free reverse pickup and either send a replacement or issue a full coin refund — your choice. We take full responsibility for items damaged during transit or manufacturing defects.
                </P>
              </Section>

              {/* 9 */}
              <Section title="9. Cancellation Policy">
                <P>
                  Orders can be cancelled <strong>before dispatch only</strong>. Once an order is shipped via Shiprocket, cancellation is not possible.
                </P>
                <UL items={[
                  "To cancel, contact us immediately after placing the order",
                  "If cancelled before dispatch: full amount refunded as Yashoda Coins within 24 hours",
                  "If the order is already dispatched: cancellation is not accepted — you may initiate a return after delivery",
                ]} />
              </Section>

              {/* 10 */}
              <Section title="10. Refund Timeline">
                <UL items={[
                  "Return approved + item received by us → Coins credited within 2–3 business days",
                  "Cancellation before dispatch → Coins credited within 24 hours",
                  "Defective item replacement → Dispatched within 2–3 business days of receiving the return",
                ]} />
              </Section>

              {/* 11 */}
              <Section title="11. Return Address">
                <P>
                  Ship returns to:<br />
                  <strong>Yashoda Fashion</strong><br />
                  B-204 Gajanan Flora, Opp Uma School,<br />
                  Nikol Naroda, Ahmedabad – 382350, Gujarat, India<br />
                  📞 <a href="tel:+917046252356" style={{ color: "#d4af37" }}>+91 70462 52356</a>
                </P>
                <P>Please write your <strong>Order ID on the package</strong> before shipping to ensure faster processing.</P>
              </Section>

              {/* 12 */}
              <Section title="12. Contact Us">
                <P>For any return, refund, or exchange queries:</P>
                <P>
                  📧 <a href="mailto:info@yashodafashion.com" style={{ color: "#d4af37" }}>info@yashodafashion.com</a><br />
                  📞 <a href="tel:+917046252356" style={{ color: "#d4af37" }}>+91 70462 52356</a><br />
                  🕐 Monday – Saturday, 10:00 AM – 7:00 PM IST<br />
                  📍Shop no. 1-2 Greendhara apartment, Near bhagawati school, India Colony, Bapunagar, Ahmedabad, Gujarat 382350
                </P>
              </Section>

            </div>
          </div>
        </motion.div>
      </Container>
    </>
  );
};

export default RefundPloicy;
