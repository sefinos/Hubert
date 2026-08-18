import { gates, signals, gridSize, setGridSize, simulationSpeed, setSimulationSpeed } from "./state.js";
import { recordHistory } from "./history.js";

const settingsButton = document.getElementById("settingsButton");

const THEME_KEY = "hubert-theme";
const GRID_SIZE_KEY = "hubert-grid-size";
const SIM_SPEED_KEY = "hubert-sim-speed";
const GRID_SIZES = [20, 25, 30];

function buildSettingsPanel() {
    const backdrop = document.createElement("div");
    backdrop.className = "settings-backdrop";

    const panel = document.createElement("div");
    panel.className = "settings-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-label", "Settings");

    panel.innerHTML = `
        <div class="settings-panel-header">
            <span class="settings-panel-title">Settings</span>
            <button class="settings-panel-close" aria-label="Close settings">&times;</button>
        </div>
        <div class="settings-panel-body">
            <div class="settings-section">
                <span class="settings-section-label">Appearance</span>
                <button class="settings-option-btn settings-option-btn--theme" id="themeToggleButton">
                    <span class="settings-option-label">Theme</span>
                    <span class="settings-option-value" id="themeToggleValue">Dark</span>
                </button>
                <div class="settings-option-row settings-option-row--grid">
                    <span class="settings-option-label">Grid Snap Size</span>
                    <div class="grid-scale-group" id="gridScaleGroup" role="group" aria-label="Grid snap size">
                        ${GRID_SIZES.map(size => `
                            <button class="grid-scale-btn" type="button" data-size="${size}" aria-pressed="false">${size}px</button>
                        `).join("")}
                    </div>
                </div>
            </div>
            <div class="settings-section">
                <span class="settings-section-label">Circuit</span>
                <button class="settings-option-btn settings-option-btn--speed" id="simSpeedToggleButton">
                    <span class="settings-option-label">Simulation Speed</span>
                    <span class="settings-option-value" id="simSpeedToggleValue">Normal</span>
                </button>
            </div>
            <div class="settings-section">
                <span class="settings-section-label">About</span>
                <button class="settings-option-btn settings-option-btn--shortcuts" id="shortcutsToggleButton" aria-expanded="false" aria-controls="shortcutsPanel">
                    <span class="settings-option-label">Keyboard Shortcuts</span>
                    <svg class="settings-option-chevron" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M6,9 L12,15 L18,9" />
                    </svg>
                </button>
                <div class="shortcuts-panel" id="shortcutsPanel" role="region" aria-label="Keyboard shortcuts">
                    <div class="shortcuts-panel-inner">
                        <div class="shortcut-row">
                            <span class="shortcut-keys"><kbd>Ctrl</kbd><span class="shortcut-plus">+</span><kbd>Z</kbd></span>
                            <span class="shortcut-desc">Undo the last action</span>
                        </div>
                        <div class="shortcut-row">
                            <span class="shortcut-keys"><kbd>Ctrl</kbd><span class="shortcut-plus">+</span><kbd>Y</kbd></span>
                            <span class="shortcut-desc">Redo the last undone action</span>
                        </div>
                        <div class="shortcut-row">
                            <span class="shortcut-keys"><kbd>Ctrl</kbd><span class="shortcut-plus">+</span><kbd>Shift</kbd><span class="shortcut-plus">+</span><kbd>Z</kbd></span>
                            <span class="shortcut-desc">Redo (alternate)</span>
                        </div>
                        <div class="shortcut-row">
                            <span class="shortcut-keys"><kbd>Esc</kbd></span>
                            <span class="shortcut-desc">Close open panels, or exit delete mode</span>
                        </div>
                        <div class="shortcuts-panel-note">On macOS, use Cmd in place of Ctrl.</div>
                    </div>
                </div>
                <button class="settings-option-btn settings-option-btn--about" id="aboutToggleButton" aria-expanded="false" aria-controls="aboutPanel">
                    <span class="settings-option-label">About Hubert</span>
                    <svg class="settings-option-chevron" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M6,9 L12,15 L18,9" />
                    </svg>
                </button>
                <div class="shortcuts-panel" id="aboutPanel" role="region" aria-label="About Hubert">
                    <div class="shortcuts-panel-inner shortcuts-panel-inner--about">
                        <p class="about-panel-text">Built as an ongoing personal project.</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(backdrop);
    document.body.appendChild(panel);

    return { backdrop, panel };
}

const { backdrop, panel } = buildSettingsPanel();
const closeButton = panel.querySelector(".settings-panel-close");

function isOpen() {
    return panel.classList.contains("is-open");
}

function openSettings() {
    backdrop.classList.add("is-open");
    panel.classList.add("is-open");
    if (settingsButton) settingsButton.setAttribute("aria-expanded", "true");
}

function closeSettings() {
    backdrop.classList.remove("is-open");
    panel.classList.remove("is-open");
    if (settingsButton) settingsButton.setAttribute("aria-expanded", "false");
}

if (settingsButton) {
    settingsButton.addEventListener("click", () => {
        isOpen() ? closeSettings() : openSettings();
    });
}

closeButton.addEventListener("click", closeSettings);
backdrop.addEventListener("click", closeSettings);
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen()) closeSettings();
});

const themeButton = panel.querySelector("#themeToggleButton");
const themeValue = panel.querySelector("#themeToggleValue");

function currentTheme() {
    return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

function applyTheme(theme) {
    if (theme === "light") {
        document.documentElement.setAttribute("data-theme", "light");
    } else {
        document.documentElement.removeAttribute("data-theme");
    }
    localStorage.setItem(THEME_KEY, theme);
    themeValue.textContent = theme === "light" ? "Light" : "Dark";
}

themeButton.addEventListener("click", () => {
    applyTheme(currentTheme() === "light" ? "dark" : "light");
});

themeValue.textContent = currentTheme() === "light" ? "Light" : "Dark";

const gridScaleGroup = panel.querySelector("#gridScaleGroup");
const gridScaleButtons = Array.from(panel.querySelectorAll(".grid-scale-btn"));

function markActiveGridButton(size) {
    gridScaleButtons.forEach(btn => {
        const isActive = Number(btn.dataset.size) === size;
        btn.classList.toggle("is-active", isActive);
        btn.setAttribute("aria-pressed", String(isActive));
    });
}

function setGridSizeVar(size) {
    document.documentElement.style.setProperty("--grid-size", `${size}px`);
}

function rescalePlacedComponents(oldSize, newSize) {
    const ratio = newSize / oldSize;

    gates.forEach(gate => {
        gate.x = Math.round(gate.x * ratio);
        gate.y = Math.round(gate.y * ratio);
        const el = document.getElementById(gate.id);
        if (el) {
            el.style.left = `${gate.x}px`;
            el.style.top = `${gate.y}px`;
        }
    });

    signals.forEach(signal => {
        signal.y = Math.round(signal.y * ratio);
        const el = document.getElementById(signal.id);
        if (el) el.style.top = `${signal.y}px`;
    });
}

function applyGridSize(newSize, { persist = true, rescale = true } = {}) {
    const oldSize = gridSize;
    if (newSize === oldSize) {
        markActiveGridButton(newSize);
        return;
    }

    if (rescale) {
        recordHistory();
        rescalePlacedComponents(oldSize, newSize);
    }

    setGridSize(newSize);
    setGridSizeVar(newSize);
    markActiveGridButton(newSize);
    if (persist) localStorage.setItem(GRID_SIZE_KEY, String(newSize));
}

gridScaleGroup.addEventListener("click", (e) => {
    const btn = e.target.closest(".grid-scale-btn");
    if (!btn) return;
    applyGridSize(Number(btn.dataset.size));
});

const storedGridSize = Number(localStorage.getItem(GRID_SIZE_KEY));
if (GRID_SIZES.includes(storedGridSize)) {
    applyGridSize(storedGridSize, { persist: false, rescale: false });
} else {
    markActiveGridButton(gridSize);
}

function setupAccordion(button, contentPanel) {
    function setOpen(shouldOpen) {
        button.classList.toggle("is-active", shouldOpen);
        button.setAttribute("aria-expanded", String(shouldOpen));

        if (shouldOpen) {
            contentPanel.style.maxHeight = `${contentPanel.scrollHeight}px`;
        } else {
            contentPanel.style.maxHeight = "0px";
        }
    }

    button.addEventListener("click", () => {
        setOpen(!button.classList.contains("is-active"));
    });
}

setupAccordion(panel.querySelector("#shortcutsToggleButton"), panel.querySelector("#shortcutsPanel"));
setupAccordion(panel.querySelector("#aboutToggleButton"), panel.querySelector("#aboutPanel"));


const simSpeedButton = panel.querySelector("#simSpeedToggleButton");
const simSpeedValue = panel.querySelector("#simSpeedToggleValue");

function applySimSpeed(speed, { persist = true } = {}) {
    setSimulationSpeed(speed);
    simSpeedValue.textContent = speed === "instant" ? "Instant" : "Normal";
    if (persist) localStorage.setItem(SIM_SPEED_KEY, speed);
}

simSpeedButton.addEventListener("click", () => {
    applySimSpeed(simulationSpeed === "instant" ? "normal" : "instant");
});

const storedSimSpeed = localStorage.getItem(SIM_SPEED_KEY);
applySimSpeed(storedSimSpeed === "instant" ? "instant" : "normal", { persist: false });
