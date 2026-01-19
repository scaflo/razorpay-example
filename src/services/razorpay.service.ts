import Razorpay from "razorpay";
import crypto from "crypto";
import envConfig from "$/env.config.js";

const razorpayInstance = new Razorpay({
    key_id: envConfig.RAZOR_KEY_ID,
    key_secret: envConfig.RAZOR_KEY_SECRET,
});

interface OrderOptions {
    amount: number;
    currency?: string;
    receipt?: string;
    notes?: Record<string, string>;
}

interface OrderResponse {
    id: string;
    entity: string;
    amount: number;
    amount_paid: number;
    amount_due: number;
    currency: string;
    receipt: string;
    status: string;
    created_at: number;
}

export async function createOrder(options: OrderOptions): Promise<OrderResponse> {
    const order = await razorpayInstance.orders.create({
        amount: options.amount * 100,
        currency: options.currency || "INR",
        receipt: options.receipt || `rcpt_${Date.now()}`,
        notes: options.notes || {},
    });
    return order as OrderResponse;
}

export function verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string
): boolean {
    const body = orderId + "|" + paymentId;
    const expectedSignature = crypto
        .createHmac("sha256", envConfig.RAZOR_KEY_SECRET)
        .update(body)
        .digest("hex");
    return crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(signature)
    );
}

export function verifyWebhookSignature(
    rawBody: string | Buffer,
    signature: string
): boolean {
    const expectedSignature = crypto
        .createHmac("sha256", envConfig.RAZOR_WEBHOOK_SECRET)
        .update(rawBody)
        .digest("hex");
    return crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(signature)
    );
}

export { razorpayInstance };
