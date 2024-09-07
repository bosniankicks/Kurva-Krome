const { Kurvaaa, By, BrowserConnectionError, NoSuchElementException } = require('../browser');

async function main() {
    const kurva = new Kurvaaa();
    try {
        const browser = await kurva.browser();
        await browser.get("https://github.com/bosniankicks");
        await browser.stop(5000); // Wait for the page to load


        // Demonstrate coordClick() function
        // You should adjust these based on the actual layout of the page
        await browser.coordClick(100, 100);
        await browser.stop(2000); // Wait a bit after clicking

        await browser.coordClick(200, 200);
        await browser.stop(1000); // Wait a bit after clicking


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
