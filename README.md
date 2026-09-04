# Agent Commerce Gateway
> **AI Growth & Autonomous Commerce Engine**  
> Enables merchants to grow revenue via intelligent bundling/cross-sell and become transactable by AI buyers end-to-end on Razorpay test-mode payments with explainable, bounded, and gated guardrails.

---

## 🚀 Key Features & Hackathon "The Bar" Compliance

1. **Agent-Readable Catalog (`/api/products`)**:
   - Conforms strictly to the Codata OpenAPI schema (`Product` entity with features, AI-verifiable specifications, stock, deliveryDays, returnPolicyDays, and rating).
2. **AI Revenue Growth (Upsell & Cross-Sell Engine)**:
   - When a shopper/agent selects or discusses an item (e.g. AuraWave Pro Headphones), the agent dynamically proposes an explainable bundle (Hard-Shell Travel Case at 15% discount) to increase Average Order Value (AOV).
3. **The Bar: Every Money Action Explainable, Bounded & Gated**:
   - **Explainable**: Every proposed order includes an `IntentExplanation` payload stating *why* the item was selected, *how* pricing and discounts were derived, and delivery guarantees.
   - **Bounded**: Guardrail policies enforce a hard single-order ceiling (₹10,000 INR limit) and max quantity limit.
   - **Gated**: `awaiting_approval` state requires an explicit human-in-the-loop approval before any money action or Razorpay checkout order is initiated.
4. **Live Audit Trail (`/api/audit-logs`)**:
   - Real-time logger tracking every `AgentToolCall` (tool name, input/output payload, execution duration in ms, and timestamps).
5. **Graceful Failure Demonstration**:
   - Built-in one-click tests for:
     - **Out-of-Stock Item**: Catches inventory shortage, logs the incident, and gracefully suggests immediate in-stock alternatives without crashing.
     - **Spending Bound Violation**: Blocks attempts exceeding ₹10,000, protecting the merchant and buyer from unbounded autonomous actions.

---

## 🛠️ Quick Start

### 1. Install Dependencies
```bash
cd "C:\Users\Tejaswini\.gemini\antigravity\scratch\agent-commerce-gateway"
npm install
```

### 2. Start the Server
```bash
npm start
```

### 3. Open the UI
Open your browser at:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 💳 Razorpay Test Mode Setup
The application works immediately out-of-the-box with a high-fidelity built-in sandbox simulator.

To link your real Razorpay Test Account:
1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/) > Settings > API Keys (Test Mode).
2. Generate `Key ID` and `Key Secret`.
3. Create `.env` in this directory:
   ```env
   RAZORPAY_KEY_ID=rzp_test_YourKeyHere
   RAZORPAY_KEY_SECRET=YourSecretKeyHere
   ```
4. Restart `npm start`.
