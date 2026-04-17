function initLanding() {
	const typeTarget = document.getElementById("typeTarget");
	if (!typeTarget) return;
	const caret = document.querySelector(".typeCaret");

	const prefersReduced =
		window.matchMedia &&
		window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	const text = "Yappy";
	if (prefersReduced) {
		typeTarget.textContent = text;
		if (caret) caret.style.opacity = "0";
		return;
	}

	typeTarget.textContent = "";

	// Build per-letter spans so CSS can animate each one.
	const letters = text.split("");
	letters.forEach((ch, idx) => {
		const span = document.createElement("span");
		span.className = "yappyLetter";
		span.textContent = ch;
		span.style.animationDelay = `${180 + idx * 90}ms`;
		typeTarget.appendChild(span);
	});

	// Fade the caret out once the last letter lands.
	const totalMs = 180 + (letters.length - 1) * 90 + 520;
	window.setTimeout(() => {
		if (!caret) return;
		caret.classList.add("caretDone");
	}, totalMs);
}
