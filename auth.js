const YAPPY_USERS_KEY = "yappy_users_v1";
const YAPPY_SESSION_KEY = "yappy_session_v1";

function normalizeEmail(email) {
	return String(email || "")
		.trim()
		.toLowerCase();
}

function readUsers() {
	try {
		return JSON.parse(localStorage.getItem(YAPPY_USERS_KEY) || "[]");
	} catch {
		return [];
	}
}

function writeUsers(users) {
	localStorage.setItem(YAPPY_USERS_KEY, JSON.stringify(users));
}

function getUserByEmail(email) {
	const target = normalizeEmail(email);
	return readUsers().find((u) => normalizeEmail(u.email) === target) || null;
}

function createUser({ username, email, password }) {
	const cleanEmail = normalizeEmail(email);
	if (!cleanEmail.includes("@")) throw new Error("Please enter a valid email.");
	if (!username || String(username).trim().length < 2) throw new Error("Username is too short.");
	if (!password || String(password).length < 6)
		throw new Error("Password must be at least 6 characters.");

	const users = readUsers();
	if (users.some((u) => normalizeEmail(u.email) === cleanEmail)) {
		throw new Error("An account with this email already exists.");
	}

	users.push({
		username: String(username).trim(),
		email: cleanEmail,
		password: String(password),
		createdAt: Date.now(),
	});
	writeUsers(users);
	return cleanEmail;
}

function setSession(email) {
	localStorage.setItem(
		YAPPY_SESSION_KEY,
		JSON.stringify({ email: normalizeEmail(email), createdAt: Date.now() })
	);
}

function clearSession() {
	localStorage.removeItem(YAPPY_SESSION_KEY);
}

function getSession() {
	try {
		return JSON.parse(localStorage.getItem(YAPPY_SESSION_KEY) || "null");
	} catch {
		return null;
	}
}

function getCurrentUserEmail() {
	const session = getSession();
	return session && session.email ? normalizeEmail(session.email) : null;
}

function getCurrentUser() {
	const email = getCurrentUserEmail();
	if (!email) return null;
	return getUserByEmail(email);
}

function loginWithEmailAndPassword(email, password) {
	const cleanEmail = normalizeEmail(email);
	const user = getUserByEmail(cleanEmail);
	if (!user) throw new Error("No account found for this email.");
	if (!password || String(password).length < 6)
		throw new Error("Password must be at least 6 characters.");
	if (String(user.password) !== String(password)) throw new Error("Incorrect password.");
	setSession(cleanEmail);
	return user;
}

function requireAuthOrRedirect() {
	const user = getCurrentUser();
	if (!user) {
		window.location.href = "login.html";
		return null;
	}
	return user;
}

function redirectIfAuthed(target = "todo.html") {
	if (getCurrentUser()) window.location.href = target;
}

