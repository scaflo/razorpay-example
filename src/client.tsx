import { hydrateRoot } from "react-dom/client";
import App from "./App";

declare global {
    interface Window {
        __INITIAL_PROPS__?: { razorpayKeyId?: string };
    }
}

const props = typeof window !== "undefined" && window.__INITIAL_PROPS__ ? window.__INITIAL_PROPS__ : {};
hydrateRoot(document.getElementById("root")!, <App {...props} />);
