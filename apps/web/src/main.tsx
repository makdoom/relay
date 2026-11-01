import { createRoot } from "react-dom/client";

import "./index.css";
import { ThemeProvider } from "@/components/theme-provider.tsx";
import App from "./App.tsx";

// biome-ignore lint/style/noNonNullAssertion: Root is always present
createRoot(document.getElementById("root")!).render(
	<ThemeProvider>
		<App />
	</ThemeProvider>,
);
