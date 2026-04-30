const definedTasks = new Map<string, unknown>();
const registeredTasks = new Set<string>();

export function defineTask(taskName: string, taskExecutor: unknown) {
  definedTasks.set(taskName, taskExecutor);
}

export function isTaskDefined(taskName: string) {
  return definedTasks.has(taskName);
}

export async function isTaskRegisteredAsync(taskName: string) {
  return registeredTasks.has(taskName);
}

export async function registerTaskAsync(taskName: string) {
  registeredTasks.add(taskName);
}
