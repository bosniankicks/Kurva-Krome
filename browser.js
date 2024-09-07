const cp = require('child_process');
const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class BrowserConnectionError extends Error {}
class NoSuchElementException extends Error {}

class By {
    static get XPATH() { return 'xpath'; }
    // Add more later
}

class Keyboard {
    constructor(browser) {
        this._browser = browser;
    }

    async type(text) {
        await this._browser._sendCommand("Input.insertText", { text });
    }
}

class Mouse {
    constructor(browser) {
        this._browser = browser;
    }

    async click(x, y) {
        await this._browser._sendCommand("Input.dispatchMouseEvent", {
            type: "mousePressed",
            x,
            y,
            button: "left",
            clickCount: 1
        });
        await this._browser._sendCommand("Input.dispatchMouseEvent", {
            type: "mouseReleased",
            x,
            y,
            button: "left",
            clickCount: 1
        });
    }
}

class WebElement {
    constructor(browser, elementId) {
        this.browser = browser;
        this.elementId = elementId;
    }

    async sendKeys(text) {
        await this.browser.keyboard.type(text);
    }

    async click() {
        try {
            const bounds = await this.browser._getElementBounds(this.elementId);
            const x = bounds.x + bounds.width / 2;
            const y = bounds.y + bounds.height / 2;
            await this.browser.mouse.click(x, y);
        } catch (e) {
            console.log(`Error clicking element: ${e}`);
            console.log("Attempting to click using JavaScript...");
            await this.browser._sendCommand('Runtime.callFunctionOn', {
                functionDeclaration: 'function() { this.click(); }',
                objectId: this.elementId
            });
        }
    }

    async grabtxt() {
        const result = await this.browser._sendCommand('Runtime.callFunctionOn', {
            functionDeclaration: 'function() { return this.textContent; }',
            objectId: this.elementId
        });
        if (result.result && result.result.result && result.result.result.value) {
            return result.result.result.value.trim();
        }
        throw new Error('Failed to retrieve textContent');
    }
}

class Browser {
    constructor(chromiumPath, debugPort = 9222) {
        this.chromiumPath = chromiumPath;
        this.debugPort = debugPort;
        this.wsUrl = null;
        this.ws = null;
        this.chromeUserDataDir = path.join('/tmp', `chrome_user_data_${uuidv4()}`);
        this.maxRetries = 3;
        this.retryDelay = 2000;
        this.process = null;
        this.uniqueId = uuidv4();
        this.keyboard = new Keyboard(this);
        this.mouse = new Mouse(this);
    }

    async start() {
        if (!fs.existsSync(this.chromeUserDataDir)) {
            fs.mkdirSync(this.chromeUserDataDir, { recursive: true });
        }

        const chromeArgs = [
            `--remote-debugging-port=${this.debugPort}`,
            '--disable-background-networking',
            '--disable-default-apps',
            '--disable-extensions',
            '--disable-sync',
            '--disable-translate',
            '--metrics-recording-only',
            '--mute-audio',
            '--no-first-run',
            '--safebrowsing-disable-auto-update',
            `--user-data-dir=${this.chromeUserDataDir}`,
            '--remote-allow-origins=*',
            `--kurvaaa-id=${this.uniqueId}`
        ];

        console.log("Starting Browser...");

        try {
            this.process = cp.spawn(this.chromiumPath, chromeArgs, {
                stdio: ['ignore', 'ignore', 'ignore']
            });
        } catch (e) {
            console.log(`Error starting Chrome: ${e}`);
            return false;
        }

        console.log(`Chrome process started with PID: ${this.process.pid}`);
        await this.stop(5000); 

        if (!await this._connectToCDP()) {
            console.log("Failed to connect to CDP. Chrome may not have started properly.");
            throw new BrowserConnectionError("Failed to connect to Chrome DevTools Protocol (CDP).");
        }

        return true;
    }

    async _connectToCDP() {
        for (let attempt = 0; attempt < this.maxRetries; attempt++) {
            try {
                const response = await new Promise((resolve, reject) => {
                    http.get(`http://localhost:${this.debugPort}/json`, (res) => {
                        let data = '';
                        res.on('data', (chunk) => data += chunk);
                        res.on('end', () => resolve(JSON.parse(data)));
                    }).on('error', reject);
                });

                const page = response.find(page => page.type === 'page');
                if (page) {
                    this.wsUrl = page.webSocketDebuggerUrl;
                    this.ws = new WebSocket(this.wsUrl);
                    await new Promise(resolve => this.ws.on('open', resolve));
                    console.log("Connected to Chrome DevTools Protocol");
                    return true;
                }
                console.log("No available pages found.");
            } catch (e) {
                console.log(`Request failed on attempt ${attempt + 1}: ${e}`);
            }
            await this.stop(this.retryDelay);
        }
        console.log("Failed to connect to CDP after several attempts.");
        return false;
    }

    async _sendCommand(method, params = {}) {
        return new Promise((resolve, reject) => {
            const message = JSON.stringify({ id: 1, method, params });
            this.ws.send(message);

            const listener = (data) => {
                const response = JSON.parse(data);
                if (response.id === 1) {
                    this.ws.removeListener('message', listener);
                    resolve(response);
                }
            };

            this.ws.on('message', listener);
        });
    }

    async get(url) {
        console.log(`Navigating to ${url}`);
        await this._sendCommand('Page.enable');
        await this._sendCommand('Network.enable');
        await this._sendCommand('Page.navigate', { url });

        // Wait for the page to finish loading
        return new Promise((resolve, reject) => {
            const listener = (data) => {
                const event = JSON.parse(data);
                if (event.method === 'Page.loadEventFired') {
                    this.ws.removeListener('message', listener);
                    console.log("Page loaded successfully");
                    this.stop(2000).then(resolve); // Additional wait to ensure all scripts are executed
                } else if (event.method === 'Inspector.detached') {
                    this.ws.removeListener('message', listener);
                    reject(new BrowserConnectionError("Browser disconnected during page load"));
                }
            };
            this.ws.on('message', listener);
        });
    }

    async findElement(by, value) {
        const script = this._getFindElementScript(by, value);
        const result = await this._sendCommand('Runtime.evaluate', {
            expression: script,
            returnByValue: false
        });

        if (result.result && result.result.result && result.result.result.objectId) {
            const elementId = result.result.result.objectId;
            console.log(`Element found with ${by}: ${value}`);
            return new WebElement(this, elementId);
        }
        console.log(`Element with ${by}: '${value}' not found.`);
        throw new NoSuchElementException(`Element with ${by}: '${value}' not found.`);
    }

    _getFindElementScript(by, value) {
        if (by === By.XPATH) {
            return `document.evaluate('${value}', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue`;
        }
        throw new Error(`Unsupported locator strategy: ${by}`);
    }

    async _getElementBounds(elementId) {
        const result = await this._sendCommand('DOM.getBoxModel', { objectId: elementId });
        if (!result.result || !result.result.model) {
            throw new Error(`Unexpected response when getting element bounds: ${JSON.stringify(result)}`);
        }
        const model = result.result.model;
        return {
            x: model.content[0],
            y: model.content[1],
            width: model.width,
            height: model.height
        };
    }

    async grabtxt(selector, type = 'xpath') {
        let script;
        if (type === 'xpath') {
            script = `
                (() => {
                    const element = document.evaluate('${selector}', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                    if (element) {
                        return { found: true, text: element.textContent, tag: element.tagName.toLowerCase() };
                    }
                    return { found: false };
                })()
            `;
        } else if (type === 'class') {
            script = `
                (() => {
                    const classes = '${selector}'.split(' ');
                    const elements = document.getElementsByClassName(classes[0]);
                    for (let element of elements) {
                        if (classes.every(c => element.classList.contains(c))) {
                            return { found: true, text: element.textContent, tag: element.tagName.toLowerCase() };
                        }
                    }
                    return { found: false };
                })()
            `;
        } else {
            throw new Error(`Unsupported selector type: ${type}`);
        }

        const result = await this._sendCommand('Runtime.evaluate', {
            expression: script,
            returnByValue: true
        });

        if (result.result && result.result.result && result.result.result.value) {
            const { found, text, tag } = result.result.result.value;
            if (found) {
                console.log(`Element found with ${type}: '${selector}'. Tag: ${tag}`);
                return text.trim();
            } else {
                console.log(`Element with ${type}: '${selector}' not found.`);
            }
        } else {
            console.log(`Unexpected result when evaluating ${type}: '${selector}'`);
        }
        return null;
    }

    async coordClick(x, y) {
        await this.mouse.click(x, y);
        console.log(`Clicked at coordinates (${x}, ${y})`);
    }

    async insert_js(script) {
        const result = await this._sendCommand('Runtime.evaluate', {
            expression: script,
            returnByValue: true
        });

        if (result.result && result.result.result) {
            if (result.result.result.type === 'undefined') {
                console.log('JavaScript executed successfully (no return value)');
                return undefined;
            } else {
                console.log('JavaScript executed successfully');
                return result.result.result.value;
            }
        } else if (result.exceptionDetails) {
            console.error('Error executing JavaScript:', result.exceptionDetails.text);
            throw new Error(`JavaScript execution failed: ${result.exceptionDetails.text}`);
        } else {
            console.log('Unexpected result when executing JavaScript');
            return null;
        }
    }

    async quit() {
        if (this.ws) {
            this.ws.close();
        }

        if (this.process) {
            this.process.kill();
        }

        try {
            this._removeDirectory(this.chromeUserDataDir);
        } catch (error) {
            // Silently ignore directory removal errors
        }

        console.log("Browser closed");
    }

    _removeDirectory(directory) {
        if (fs.existsSync(directory)) {
            fs.readdirSync(directory).forEach((file) => {
                const curPath = path.join(directory, file);
                if (fs.lstatSync(curPath).isDirectory()) {
                    this._removeDirectory(curPath);
                } else {
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(directory);
        }
        

    }

    async picture(filename) {
        console.log(`Taking screenshot and saving as ${filename}`);
        try {
            const result = await this._sendCommand('Page.captureScreenshot');
            if (result.result && result.result.data) {
                const buffer = Buffer.from(result.result.data, 'base64');
                await fs.promises.writeFile(filename, buffer);
                console.log(`Screenshot saved as ${filename}`);
            } else {
                throw new Error('Failed to capture screenshot');
            }
        } catch (error) {
            console.error('Error taking screenshot:', error);
            throw error;
        }
    }

    async stop(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

class Kurvaaa {
    constructor() {
        this._browser = null;
    }

    async browser(chromiumPath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome") {
        if (!fs.existsSync(chromiumPath)) {
            throw new Error(`Chrome binary not found at ${chromiumPath}. Please check the path.`);
        }
        if (!this._browser) {
            this._browser = new Browser(chromiumPath);
            if (!await this._browser.start()) {
                throw new BrowserConnectionError("Failed to start browser");
            }
        }
        return this._browser;
    }

    async end() {
        if (this._browser) {
            await this._browser.quit();
            this._browser = null;
        }
        console.log("Kurvaaa session ended");
    }
}

module.exports = { Kurvaaa, By, BrowserConnectionError, NoSuchElementException };
