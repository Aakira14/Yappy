/**
 * Add a new task to local storage
 * @param {*} newTask Task's object instance.
 */
function getTaskPrefix() {
	const email =
		typeof getCurrentUserEmail === "function" ? getCurrentUserEmail() : null;
	const userId = email ? encodeURIComponent(email) : "anon";
	return `yappy_tasks:${userId}:`;
}

function taskKey(suffix) {
	return `${getTaskPrefix()}${suffix}`;
}

function migrateLegacyTasksIfPresent() {
	const legacyAmountRaw = localStorage.getItem("task_amount");
	if (legacyAmountRaw == null) return;

	const legacyAmount = parseInt(legacyAmountRaw);
	if (!Number.isFinite(legacyAmount) || legacyAmount < 0) return;

	const newAmountKey = taskKey("task_amount");
	if (localStorage.getItem(newAmountKey) != null) return;

	localStorage.setItem(newAmountKey, String(legacyAmount));
	for (let i = 0; i < legacyAmount; i++) {
		const legacyTask = localStorage.getItem(`task_${i}`);
		if (legacyTask != null) localStorage.setItem(taskKey(`task_${i}`), legacyTask);
	}

	// Clean up legacy keys (but never clear the whole storage).
	localStorage.removeItem("task_amount");
	for (let i = 0; i < legacyAmount; i++) localStorage.removeItem(`task_${i}`);
}

function addTaskToStorage(newTask) {
	//We first need to know how many tasks already exist in our local storage.
	const taskAmount = parseInt(readAllTaskFromLocal().length);
	//We then set our "task_amount" item to the tasks amount + one because we create a new task that will be added to our storage.
	localStorage.setItem(taskKey("task_amount"), taskAmount + 1);
	//After that, we add our task to the storage. We create a new key named "task_" + our new task ID, with our task stringified as json format as a value.
	localStorage.setItem(taskKey(`task_${taskAmount}`), JSON.stringify(newTask));
	//We finally update our list.
	updateList();
}

/**
 * Return every existing tasks in our local storage as an array.
 * @returns Tasks array.
 */
function readAllTaskFromLocal() {
	//We first obtain the amount of tasks by reading the "task_amount" item, we then parse it's value as an interger.
	const taskAmount = parseInt(localStorage.getItem(taskKey("task_amount")));
	if (Number.isFinite(taskAmount)) {
		//If our "taskAmount" item exist, we return each task by storing them in a temporary array ("tasks").
		const tasks = new Array();
		for (let i = 0; i < taskAmount; i++) {
			tasks.push(localStorage.getItem(taskKey(`task_${i}`)));
		}
		return tasks;
	} else {
		//If "taskAmount" doesn't exist, we return an empty array.
		return [];
	}
}

/**
 * Delete a task of the local storage.
 * @param {*} target task's name (example : "task_3")
 */
function deleteTask(target) {
	//We first store all of our tasks in an array.
	const oldTasks = readAllTaskFromLocal();

	//We then create an empty array that will be filled with all of our tasks except of for the one we want to delete.
	const tasks = new Array();
	for (let i = 0; i < oldTasks.length; i++) {
		if (target != `task_${i}`) {
			//If the task is not the one that we want to delete, we push it into our "tasks" array.
			const v = localStorage.getItem(taskKey(`task_${i}`));
			if (v != null) tasks.push(v);
		}
	}
	//After that, we delete only the current user's task keys.
	for (let i = 0; i < oldTasks.length; i++) localStorage.removeItem(taskKey(`task_${i}`));
	localStorage.removeItem(taskKey("task_amount"));

	//Then, we create our "task_amount" item again with the new amount of tasks.
	localStorage.setItem(taskKey("task_amount"), tasks.length);
	for (let i = 0; i < tasks.length; i++) {
		//Afterward, we recreate each task item from our new tasks array ("tasks").
		localStorage.setItem(taskKey(`task_${i}`), tasks[i]);
	}
	//Finally, we update our list.
	updateList();
}

/**
 * Update the target task "isDone" status.
 * @param {*} target The target task's name (example: "tesk_3")
 */
function changeTaskState(target) {
	const raw = localStorage.getItem(taskKey(target));
	if (!raw) return;
	const task = JSON.parse(raw);
	task.isDone = !Boolean(task.isDone);
	localStorage.setItem(taskKey(target), JSON.stringify(task));
	//Finally, we update our list.
	updateList();
}
