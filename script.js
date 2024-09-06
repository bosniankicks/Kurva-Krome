const { Kurvaaa, By, BrowserConnectionError, NoSuchElementException } = require('./browser');

async function main() {
    // Intitialize Browser
    const kurva = new Kurvaaa();
    try {
        const browser = await kurva.browser();
        await browser.get("https://www.nike.com/login");

        // Wait for the page to load completely
        await browser.stop(5000);

        // Use XPath to find the input element
        const xpath = "/html/body/div[1]/div/div/div/div/form/div/div[2]/div[1]/input";
        const inputElement = await browser.findElement(By.XPATH, xpath);

        // Input text
        const inputText = "emailhere";
        await inputElement.click();
        await inputElement.sendKeys(inputText);

        const xpath2 = '/html/body/div[1]/div/div/div/div/form/div/div[4]/button';
        await browser.stop(3000);
        const submitButton = await browser.findElement(By.XPATH, xpath2);
        await submitButton.click();
        await browser.stop(4000);

        await browser.get("https://github.com/bosniankicks");
        await browser.stop(4000);

    } catch (e) {
        if (e instanceof BrowserConnectionError) {
            console.log(`Browser connection error: ${e.message}`);
        } else if (e instanceof NoSuchElementException) {
            console.log(`Element not found: ${e.message}`);
        } else {
            console.log(`An unexpected error occurred: ${e.message}`);
        }
    } finally {
        await kurva.end();
    }
}

main().catch(console.error);
