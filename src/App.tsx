import React, { useState } from "react";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, callback: () => void) => void;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface Plan {
  id: string;
  name: string;
  amount: number;
  description: string;
}

interface AppProps {
  razorpayKeyId?: string;
}

const PLANS: Plan[] = [
  { id: "basic", name: "Basic", amount: 99, description: "Perfect for trying out" },
  { id: "pro", name: "Pro", amount: 499, description: "Most popular choice" },
  { id: "enterprise", name: "Enterprise", amount: 999, description: "For large teams" },
];

const App: React.FC<AppProps> = () => {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (plan: Plan) => {
    setSelectedPlan(plan);
    setStatus("loading");
    setMessage("");

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setStatus("error");
      setMessage("Failed to load payment gateway");
      return;
    }

    try {
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: plan.amount,
          currency: "INR",
          receipt: `rcpt_${plan.id}_${Date.now()}`,
          notes: { plan: plan.name },
        }),
      });

      const orderData = await orderRes.json();
      if (!orderData.success) throw new Error(orderData.error);

      const configRes = await fetch("/api/payments/config");
      const configData = await configRes.json();

      if (!configData.keyId) throw new Error("Razorpay key not configured");

      const options: RazorpayOptions = {
        key: configData.keyId,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "Payment Demo",
        description: `${plan.name} Plan`,
        order_id: orderData.order.id,
        handler: async (response: RazorpayResponse) => {
          try {
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              setStatus("success");
              setMessage(`Payment successful! ID: ${verifyData.paymentId}`);
            } else {
              setStatus("error");
              setMessage("Payment verification failed");
            }
          } catch {
            setStatus("error");
            setMessage("Payment verification failed");
          }
        },
        prefill: {
          name: "Test User",
          email: "test@example.com",
          contact: "9999999999",
        },
        theme: { color: "#6366f1" },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", () => {
        setStatus("error");
        setMessage("Payment failed. Please try again.");
      });

      razorpay.open();
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <div className="mx-auto max-w-6xl h-screen flex flex-col justify-center px-6 py-12">
      <h1 className="text-center text-3xl font-bold text-gray-900">
        Choose Your Plan
      </h1>
      <p className="mt-2 text-center text-gray-500">
        Select a plan that works best for you
      </p>

      <div className="mt-10 grid gap-8 grid-cols-3">
        {PLANS.map((plan) => {
          const isSelected = selectedPlan?.id === plan.id;
          const isPro = plan.id === "pro";

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border bg-white p-8 transition-all
                ${isPro ? "border-indigo-500 shadow-lg" : "border-gray-200"}
                ${isSelected ? "ring-2 ring-indigo-400" : ""}
                hover:-translate-y-1 hover:shadow-xl`}
            >
              {isPro && (
                <span className="absolute -top-3 right-6 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
                  Most Popular
                </span>
              )}

              <h2 className="text-xl font-semibold text-gray-900">
                {plan.name}
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                {plan.description}
              </p>

              <div className="mt-6 flex items-baseline justify-center gap-1">
                <span className="text-lg text-gray-500">₹</span>
                <span className="text-4xl font-bold text-gray-900">
                  {plan.amount}
                </span>
              </div>

              <button
                onClick={() => handlePayment(plan)}
                disabled={status === "loading"}
                className={`mt-8 w-full rounded-xl px-4 py-3 text-sm font-semibold transition
                  ${status === "loading" && isSelected
                    ? "cursor-not-allowed bg-gray-400"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                  }`}
              >
                {status === "loading" && isSelected
                  ? "Processing..."
                  : "Pay Now"}
              </button>
            </div>
          );
        })}
      </div>

      {message && (
        <div
          className={`mx-auto mt-8 max-w-md rounded-xl px-6 py-4 text-center text-sm font-medium
            ${status === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
            }`}
        >
          {message}
        </div>
      )}
    </div>
  );
};

export default App;
