import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const root = createRoot(document.getElementById("root")!);
root.render(<App />);

// Remove the static splash screen added in index.html once the app is ready
const removeSplash = () => {
	const splash = document.getElementById('splash-screen');
	if (!splash) return;
	splash.style.transition = 'opacity 300ms ease';
	splash.style.opacity = '0';
	setTimeout(() => {
		splash.remove();
	}, 350);
};

// Wait a tick so the UI renders, then remove splash
requestAnimationFrame(() => {
	setTimeout(removeSplash, 100);
});
