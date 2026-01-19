import { Router, Request, Response, raw } from "express";
import type { Router as RouterType } from "express";
import {
    createOrder,
    verifyPaymentSignature,
    verifyWebhookSignature,
} from "$/services/razorpay.service.js";
import envConfig from "$/env.config.js";

const router: RouterType = Router();

router.get("/config", (_req: Request, res: Response) => {
    res.json({ keyId: envConfig.RAZOR_KEY_ID });
});

router.post("/create-order", async (req: Request, res: Response) => {
    try {
        const { amount, currency, receipt, notes } = req.body;

        if (!amount || amount <= 0) {
            res.status(400).json({ success: false, error: "Invalid amount" });
            return;
        }

        const order = await createOrder({ amount, currency, receipt, notes });
        res.json({ success: true, order });
    } catch (error) {
        console.error("Order creation failed:", error);
        res.status(500).json({ success: false, error: "Order creation failed" });
    }
});

router.post("/verify", async (req: Request, res: Response) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            res.status(400).json({ success: false, error: "Missing payment details" });
            return;
        }

        const isValid = verifyPaymentSignature(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        );

        if (isValid) {
            res.json({
                success: true,
                message: "Payment verified successfully",
                paymentId: razorpay_payment_id,
            });
        } else {
            res.status(400).json({ success: false, error: "Invalid signature" });
        }
    } catch (error) {
        console.error("Payment verification failed:", error);
        res.status(500).json({ success: false, error: "Verification failed" });
    }
});

router.post("/webhook", raw({ type: "application/json" }), (req: Request, res: Response) => {
    try {
        const signature = req.headers["x-razorpay-signature"] as string;

        if (!signature) {
            res.status(400).json({ error: "Missing signature" });
            return;
        }

        const isValid = verifyWebhookSignature(req.body, signature);

        if (!isValid) {
            res.status(400).json({ error: "Invalid signature" });
            return;
        }

        const event = JSON.parse(req.body.toString());
        console.log("Webhook received:", event.event);

        switch (event.event) {
            case "payment.authorized":
                console.log("Payment authorized:", event.payload.payment.entity.id);
                break;
            case "payment.captured":
                console.log("Payment captured:", event.payload.payment.entity.id);
                break;
            case "payment.failed":
                console.log("Payment failed:", event.payload.payment.entity.id);
                break;
            case "order.paid":
                console.log("Order paid:", event.payload.order.entity.id);
                break;
            default:
                console.log("Unhandled event:", event.event);
        }

        res.json({ status: "ok" });
    } catch (error) {
        console.error("Webhook processing failed:", error);
        res.status(500).json({ error: "Webhook processing failed" });
    }
});

export default router;
