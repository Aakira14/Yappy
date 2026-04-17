function setError(text) {
	const el = document.getElementById("errorText");
	if (!el) return;
	if (!text) {
		el.textContent = "";
		el.dataset.show = "false";
		return;
	}
	el.textContent = text;
	el.dataset.show = "true";
}

function wirePasswordToggle(inputId = "password", buttonId = "togglePassword") {
	const input = document.getElementById(inputId);
	const button = document.getElementById(buttonId);
	if (!input || !button) return;

	const sync = () => {
		const isHidden = input.type === "password";
		button.textContent = isHidden ? "Show" : "Hide";
	};
	sync();

	button.addEventListener("click", () => {
		input.type = input.type === "password" ? "text" : "password";
		sync();
	});
}

function initLoginPage() {
	redirectIfAuthed("todo.html");

	wirePasswordToggle();
	setError("");

	const form = document.getElementById("loginForm");
	if (!form) return;

	form.addEventListener("submit", (e) => {
		e.preventDefault();
		setError("");

		const email = document.getElementById("email")?.value || "";
		const password = document.getElementById("password")?.value || "";

		try {
			loginWithEmailAndPassword(email, password);
			window.location.href = "todo.html";
		} catch (err) {
			setError(err?.message || "Login failed.");
		}
	});
}

