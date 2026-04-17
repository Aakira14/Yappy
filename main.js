//This array is used to build our filter's buttons
const filters = new Array("All", "To do", "Done");
//We then create an empty variable that will later be set to our current selected filter.
let selectedFilter;

/**
 * This function is called when our page's body is fully loaded.
 * Our filters and interface are initialized by it.
 */
function Init() {
	const user = requireAuthOrRedirect();
	if (!user) return;

	const greetingText = document.getElementById("greetingText");
	if (greetingText) greetingText.textContent = `Hi, ${user.username}`;

	const logoutBtn = document.getElementById("logoutBtn");
	if (logoutBtn) {
		logoutBtn.onclick = () => {
			clearSession();
			window.location.href = "login.html";
		};
	}

	// Profile drawer
	const profileBtn = document.getElementById("profileBtn");
	const drawer = document.getElementById("profileDrawer");
	const overlay = document.getElementById("drawerOverlay");
	const closeDrawerBtn = document.getElementById("closeDrawerBtn");
	const drawerUsername = document.getElementById("drawerUsername");
	const drawerEmail = document.getElementById("drawerEmail");

	if (drawerUsername) drawerUsername.textContent = user.username || "User";
	if (drawerEmail) drawerEmail.textContent = user.email || "";

	let drawerOpen = false;
	const setDrawerOpen = (open) => {
		if (!drawer || !overlay || !profileBtn) return;
		drawerOpen = Boolean(open);
		drawer.dataset.open = drawerOpen ? "true" : "false";
		overlay.dataset.open = drawerOpen ? "true" : "false";
		drawer.setAttribute("aria-hidden", drawerOpen ? "false" : "true");
		overlay.setAttribute("aria-hidden", drawerOpen ? "false" : "true");
		profileBtn.setAttribute("aria-expanded", drawerOpen ? "true" : "false");
		if (drawerOpen) {
			window.setTimeout(() => closeDrawerBtn?.focus?.(), 0);
		} else {
			window.setTimeout(() => profileBtn?.focus?.(), 0);
		}
	};

	if (profileBtn) profileBtn.addEventListener("click", () => setDrawerOpen(!drawerOpen));
	if (overlay) overlay.addEventListener("click", () => setDrawerOpen(false));
	if (closeDrawerBtn)
		closeDrawerBtn.addEventListener("click", (e) => {
			e.preventDefault();
			e.stopPropagation();
			setDrawerOpen(false);
		});
	document.addEventListener("keydown", (e) => {
		if (e.key === "Escape" && drawerOpen) setDrawerOpen(false);
	});

	if (typeof migrateLegacyTasksIfPresent === "function") migrateLegacyTasksIfPresent();

	buildFilters();
	initInterface();

	// Button ripple origin (pure CSS ripple, we only feed coordinates)
	document.addEventListener("pointerdown", (e) => {
		if (!e.target || !e.target.closest) return;
		const button = e.target.closest("button");
		if (!button) return;
		const rect = button.getBoundingClientRect();
		const x = ((e.clientX - rect.left) / rect.width) * 100;
		const y = ((e.clientY - rect.top) / rect.height) * 100;
		button.style.setProperty("--ripple-x", `${Math.max(0, Math.min(100, x))}%`);
		button.style.setProperty("--ripple-y", `${Math.max(0, Math.min(100, y))}%`);
	});
}

/**
 * Build our filter's buttons with our "filters" array variable
 */
function buildFilters() {
	//We first obtain our container element from our html by his ID.
	const CONTAINER = document.getElementById("filtersContainer");
	//Then, for each filter, we create a new button
	for (let filter in filters) {
		const newButton = document.createElement("button");
		//! Don't forget that we remove any white spaces from our filter's name to set it as our button's ID.
		newButton.id = filters[filter].replace(" ", "");
		newButton.innerText = filters[filter];
		newButton.onclick = function (e) {
			//We set our button (using this) as a parameter to later obtain his ID, aka, our selected filter's name WITHOUT SPACES.
			return updateFilters(this);
		};
		//Finally, we append our new button to our container.
		CONTAINER.appendChild(newButton);
	}
}
