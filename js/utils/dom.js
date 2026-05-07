export function setInsight(id, html) {
  const element = document.querySelector(id);
  if (element) {
    element.innerHTML = html;
  }
}

export function setActiveTrigger(moduleName, predicate) {
  document
    .querySelectorAll(`.narrative-trigger[data-module="${moduleName}"]`)
    .forEach((trigger) => {
      trigger.classList.toggle("is-active", predicate(trigger));
    });
}

export function showEmpty(containerId, message) {
  const container = document.querySelector(containerId);
  if (container) {
    container.innerHTML = `<div class="empty-state">${message}</div>`;
  }
}
