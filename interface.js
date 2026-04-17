const listContainer = document.getElementById("listContainer");

let yappySelectedDateKey = null;
let yappyDateSearch = "";

function dateKeyFromTimestamp(ts) {
	const d = new Date(ts);
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

function tryParseLegacyCreationDate(text) {
	// Expected: "d/m/yyyy h m" (not zero-padded)
	if (!text) return null;
	const s = String(text).trim();
	const match = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2})\s+(\d{1,2}))?$/);
	if (!match) return null;
	const dd = parseInt(match[1], 10);
	const mm = parseInt(match[2], 10) - 1;
	const yyyy = parseInt(match[3], 10);
	const hh = match[4] != null ? parseInt(match[4], 10) : 0;
	const min = match[5] != null ? parseInt(match[5], 10) : 0;
	const d = new Date(yyyy, mm, dd, hh, min, 0, 0);
	const ts = d.getTime();
	return Number.isFinite(ts) ? ts : null;
}

function getTaskCreatedAt(task) {
	if (task && Number.isFinite(task.createdAt)) return task.createdAt;
	const legacy = tryParseLegacyCreationDate(task?.creationDate);
	if (legacy != null) return legacy;
	return 0;
}

function formatDateTitle(dateKey) {
	const parts = String(dateKey || "").split("-");
	if (parts.length !== 3) return dateKey;
	const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
	try {
		return new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "2-digit", year: "numeric" }).format(d);
	} catch {
		return dateKey;
	}
}

function formatDateSub(dateKey) {
	return String(dateKey || "");
}

function setDateView(dateKeyOrNull) {
	yappySelectedDateKey = dateKeyOrNull;
	const backBtn = document.getElementById("backToDatesBtn");
	const dateSearch = document.getElementById("dateSearch");
	const filtersContainer = document.getElementById("filtersContainer");
	if (backBtn) backBtn.style.display = yappySelectedDateKey ? "inline-flex" : "none";
	if (dateSearch) dateSearch.style.display = yappySelectedDateKey ? "none" : "inline-flex";
	if (filtersContainer) filtersContainer.style.display = yappySelectedDateKey ? "flex" : "none";
	updateList();
}

function closeTaskPopup() {
	const popupBackground = document.getElementById("Popup_Background");
	if (!popupBackground) return;

	popupBackground.classList.add("popupClosing");

	const popup = document.getElementById("Popup");
	if (popup) popup.classList.add("popupClosing");

	if (window.__popupEscHandler) {
		document.removeEventListener("keydown", window.__popupEscHandler);
		window.__popupEscHandler = undefined;
	}

	window.setTimeout(() => {
		const elem = document.getElementById("Popup_Background");
		if (elem) elem.remove();
	}, 180);
}

/**
 * Initialize our interface when our page is fully loaded
 */
function initInterface() {
	const dateSearch = document.getElementById("dateSearch");
	if (dateSearch) {
		dateSearch.addEventListener("input", (e) => {
			yappyDateSearch = String(e.target.value || "").trim().toLowerCase();
			updateList();
		});
	}

	const backBtn = document.getElementById("backToDatesBtn");
	if (backBtn) backBtn.addEventListener("click", () => setDateView(null));

	updateFilters();
	setDateView(null);
}

/**
 * Update our tasks list using filters when any action is performed.
 */
function updateList() {
	//Check if the tasks container element exists in our html (it should anyway).
	if (listContainer != undefined) {
		//If the container exists, we clear it's html content.
		listContainer.innerHTML = "";
		//We then obtain the amount of tasks that exist in our local storage.
		const taskAmount = parseInt(localStorage.getItem(taskKey("task_amount")));
		//Our task amount html text element
		const amountText = document.getElementById("taskAmount");

		if (!Number.isFinite(taskAmount) || taskAmount == 0) {
			amountText.innerHTML = `You have no task(s)...`;
			return;
		}

		const tasks = [];
		for (let i = 0; i < taskAmount; i++) {
			const raw = localStorage.getItem(taskKey(`task_${i}`));
			if (!raw) continue;
			const task = JSON.parse(raw);
			tasks.push({
				id: `task_${i}`,
				task,
				createdAt: getTaskCreatedAt(task),
			});
		}

		// Group tasks by date
		const groups = new Map();
		for (const item of tasks) {
			const dateKey = dateKeyFromTimestamp(item.createdAt);
			if (!groups.has(dateKey)) groups.set(dateKey, []);
			groups.get(dateKey).push(item);
		}

		const allDateKeys = Array.from(groups.keys()).sort((a, b) => (a < b ? 1 : -1));

		if (!yappySelectedDateKey) {
			// DATE CARDS VIEW
			const query = yappyDateSearch;
			const queryVariants = new Set();
			if (query) {
				queryVariants.add(query);
				const querySlashes = query.split("-").join("/");
				queryVariants.add(querySlashes);
				const parts = querySlashes.split("/");
				if (parts.length === 3 && parts[0].length <= 2 && parts[2].length === 4) {
					// dd/mm/yyyy -> yyyy-mm-dd (rough)
					const dd = parts[0].padStart(2, "0");
					const mm = parts[1].padStart(2, "0");
					const yyyy = parts[2];
					queryVariants.add(`${yyyy}-${mm}-${dd}`);
				}
			}
			const filteredKeys = query
				? allDateKeys.filter((k) => {
						const alt = k.split("-").reverse().join("/");
						for (const q of queryVariants) {
							if (k.toLowerCase().includes(q) || alt.toLowerCase().includes(q)) return true;
						}
						return false;
					})
				: allDateKeys;

			amountText.innerHTML = `${filteredKeys.length} date(s)`;

			for (const dateKey of filteredKeys) {
				const items = groups.get(dateKey) || [];
				const done = items.filter((t) => Boolean(t.task?.isDone)).length;
				const total = items.length;

				const li = document.createElement("li");
				li.style.setProperty("--i", String(listContainer.children.length));
				li.appendChild(
					Object.assign(document.createElement("button"), {
						className: "dateCard",
						type: "button",
					})
				);
				const card = li.querySelector("button");
				card.onclick = () => setDateView(dateKey);

				const meta = card.appendChild(Object.assign(document.createElement("div"), { className: "dateMeta" }));
				meta.appendChild(Object.assign(document.createElement("div"), { className: "dateTitle", textContent: formatDateTitle(dateKey) }));
				meta.appendChild(Object.assign(document.createElement("div"), { className: "dateSub", textContent: formatDateSub(dateKey) }));

				card.appendChild(
					Object.assign(document.createElement("div"), {
						className: "dateCount",
						textContent: `${done}/${total}`,
						title: "Done/Total",
					})
				);

				listContainer.appendChild(li);
			}
			return;
		}

		// SINGLE DATE VIEW
		const dateItems = (groups.get(yappySelectedDateKey) || [])
			.slice()
			.sort((a, b) => a.createdAt - b.createdAt);

		let shown = 0;
		for (const item of dateItems) {
			const parsedTask = item.task;

			if (selectedFilter == filters[0].replace(" ", "")
				||
				(selectedFilter == filters[1].replace(" ", "") && parsedTask.isDone == false)
				||
				(selectedFilter == filters[2].replace(" ", "") && parsedTask.isDone == true)
			) {

				//Then, for each task that matches with our selected filter, we create a new element and we append it to our "listContainer" element.

				//It's probably a terrible way to create our elements, let me know if you have better ways.
				listContainer.appendChild(
					Object.assign(document.createElement("li"), {
						className: "taskElement",
						id: item.id
					})
				);

				const TASK_ELEM = document.getElementById(item.id);
				TASK_ELEM.style.setProperty("--i", `${listContainer.children.length - 1}`);
				TASK_ELEM.appendChild(
					Object.assign(document.createElement("button"), {
						id: `${item.id}_body`,
						className: "taskButton"
					})
				);

				const TASK_BODY = document.getElementById(`${item.id}_body`);
				TASK_BODY.appendChild(
					Object.assign(document.createElement("input"), {
						type: "checkbox",
						checked: Boolean(parsedTask.isDone),
					})
				);
				TASK_BODY.appendChild(
					Object.assign(document.createElement("h2"), {
						innerHTML: parsedTask.title
					})
				)
				TASK_BODY.appendChild(
					Object.assign(document.createElement("p"), {
						innerHTML: parsedTask.description
					})
				)

				TASK_ELEM.appendChild(
					Object.assign(document.createElement("button"), {
						className: "removeButton",
						id: `${item.id}_remove`
					})
				).appendChild(
					Object.assign(document.createElement("img"), {
						src: "resources/bin.png"
					})
				);

				const deleteButton = document.getElementById(`${item.id}_remove`);
				deleteButton.onclick = function () {
					const targetTaskId = this.id.toString().replace("_remove", "");
					const elem = document.getElementById(targetTaskId);
					if (elem) {
						elem.classList.add("taskLeaving");
						window.setTimeout(() => deleteTask(targetTaskId), 180);
						return;
					}
					deleteTask(targetTaskId);
				};

				TASK_BODY.onclick = function () {
					changeTaskState(this.id.toString().replace("_body", ""))
				};

				if (parsedTask.isDone == true) {
					TASK_ELEM.classList.add("taskDone")
				}

				shown += 1;
			}
		}

		let plural = "";
		if (shown !== 1) plural = "s";
		amountText.innerHTML = `${shown} task${plural} • ${formatDateSub(yappySelectedDateKey)}`;
	} else {
		console.error("Error ! Cannot find any valid list container element !");
	}
}

/**
 * This function updates the selected filter when any filter button is pressed by the user (Default: **ALL**)
 * @param {*} targetButton This parameter **NEED** to be a button containing a filter present in our filters list array ("*filters*") as an **ID without spaces**.
 */
function updateFilters(
	targetButton = document.getElementById("filtersContainer").children[0]
) {
	//We obtain our button's ID, that is actually our filter's name WITHOUT SPACE.
	selectedFilter = targetButton.id;

	const CONTAINER = document.getElementById("filtersContainer");
	for (let child of CONTAINER.children) {
		//First, we remove the "buttonSelected" class of each button.
		child.classList.remove("buttonSelected");
	}
	let activeButton = document.getElementById(selectedFilter);
	//Then, we add it back to the selected filter's button
	activeButton.classList.add("buttonSelected");
	//Finally we update our list.
	updateList();
}

/**
 * This function creates an overlay with different textboxes inputs that allow our user to create a new task
 */
function newTaskOverlay() {
	document.body
		.appendChild(
			Object.assign(document.createElement("div"), {
				id: "Popup_Background",
			})
		)
		.appendChild(
			Object.assign(document.createElement("div"), {
				id: "Popup",
			})
		);
	const Popup = document.getElementById("Popup");

	const titleLayer = Popup.appendChild(
		Object.assign(document.createElement("div"), {
			id: "Popup_Title_Layer",
		})
	);
	titleLayer.appendChild(
		Object.assign(document.createElement("h2"), {
			id: "Popup_Title",
			innerHTML: "Create a new task",
		})
	);
	const closeBtn = titleLayer.appendChild(
		Object.assign(document.createElement("button"), {
			id: "Popup_Close",
			className: "popupCloseButton",
			innerHTML: "×",
		})
	);
	closeBtn.setAttribute("aria-label", "Close");
	closeBtn.onclick = closeTaskPopup;

	Popup.appendChild(
		Object.assign(document.createElement("div"), {
			className: "Popup_Description",
			innerHTML: "Task title",
		})
	);
	Popup.appendChild(
		Object.assign(document.createElement("input"), {
			type: "text",
			id: "TaskTitle",
			minlength: "4",
			maxlength: "40",
		})
	);
	Popup.appendChild(
		Object.assign(document.createElement("div"), {
			className: "Popup_Description",
			innerHTML: "Description",
		})
	);
	Popup.appendChild(
		Object.assign(document.createElement("input"), {
			type: "text",
			id: "TaskDesc",
			minlength: "4",
			maxlength: "2000",
		})
	);
	Popup.appendChild(
		Object.assign(document.createElement("button"), {
			className: "buttonSelected",
			id: "createTaskButton",
		})
	).appendChild(
		Object.assign(document.createElement("h3"), {
			innerHTML: "Create",
		})
	);

	const createTaskButton = document.getElementById("createTaskButton");
	createTaskButton.addEventListener("click", () => {
		const taskTitle = document.getElementById("TaskTitle").value;
		const taskDesc = document.getElementById("TaskDesc").value;
		if (taskTitle == "" || taskDesc == "") {
			//If the title/description is empty, we do not create our Task's object.
			alert("All fields need to be filled !");
		} else {
			//If the title/description is valid, we create a new Task object and we add it to our local storage using our "addTaskToStorage" function.
			const newTask = new Task(taskTitle, taskDesc);
			addTaskToStorage(newTask);
		}
	});

	const popupBackground = document.getElementById("Popup_Background");
	popupBackground.addEventListener("click", (e) => {
		if (e.target && e.target.id === "Popup_Background") closeTaskPopup();
	});

	window.__popupEscHandler = (e) => {
		if (e.key === "Escape") closeTaskPopup();
	};
	document.addEventListener("keydown", window.__popupEscHandler);
}
