const { Kurvaaa, By, BrowserConnectionError, NoSuchElementException } = require('../browser');

async function main() {
    const kurva = new Kurvaaa();
    try {
        const browser = await kurva.browser();
        await browser.get("https://www.zocdoc.com/doctor/aleksandr-kovalskiy-md-464470?LocIdent=124796&reason_visit=75&insuranceCarrier=&insurancePlan=-1&dr_specialty=153&isNewPatient=true&referrerType=HomePage");
        await browser.stop(10000); // Wait for the page to load
        await browser.picture('creep.png');

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
