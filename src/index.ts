import express from "express";
import path, { dirname } from "path";
import App from "./App.js";
import "./index.css";
import { fileURLToPath } from "url";
import { renderSSR } from "@scaflo/node-react-wrapper";
import envConfig from "$/env.config.js";
import paymentRoutes from "$/routes/payment.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(express.json());

const publicDir = path.join(__dirname, "..", "public");
app.use(express.static(publicDir));
app.use("/styles", express.static(path.join(__dirname, "..", "dist")));

app.use("/api/payments", paymentRoutes);

app.get("/", (_req, res) => {
    const html = renderSSR({
        App,
        title: "Razorpay Payment Demo",
        cssPath: "/styles/index.css",
        jsPath: "/client.js",
        props: { razorpayKeyId: envConfig.RAZOR_KEY_ID },
    });

    res.send(html);
});

app.listen(envConfig.PORT, () => {
    console.log(`Listening on http://localhost:${envConfig.PORT}`);
});
