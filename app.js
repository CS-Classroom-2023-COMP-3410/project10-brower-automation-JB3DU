const puppeteer = require('puppeteer');
const fs = require('fs');

// TODO: Load the credentials from the 'credentials.json' file
// HINT: Use the 'fs' module to read and parse the file
const credentials = JSON.parse(fs.readFileSync('credentials.json', 'utf-8'));

(async () => {
    // TODO: Launch a browser instance and open a new page
    const browser = await puppeteer.launch({ headless: false, executablePath: '/usr/bin/chromium', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();

    // Navigate to GitHub login page
    await page.goto('https://github.com/login');

    // TODO: Login to GitHub using the provided credentials
    // HINT: Use the 'type' method to input username and password, then click on the submit button
    await page.type('#login_field', credentials.username);
    await page.type('#password', credentials.password);
    await page.click('input[name="commit"]');
    // Wait for navigation to complete after login
    await page.waitForNavigation();
    await page.screenshot({ path: '01after-login.png' });
    // Wait for successful login
    await page.waitForSelector('.avatar.circle');

    // Extract the actual GitHub username to be used later
    const actualUsername = await page.$eval('meta[name="octolytics-actor-login"]', meta => meta.content);

    const repositories = ["cheeriojs/cheerio", "axios/axios", "puppeteer/puppeteer"];

    for (const repo of repositories) {
        await page.goto(`https://github.com/${repo}`);

        // TODO: Star the repository
        // HINT: Use selectors to identify and click on the star button
        const starButton = await page.$('#repo-stars-counter-star');
        if (starButton) {
          await starButton.click();
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          console.log(`Repository already starred or button not found for ${repo}`);
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        //await page.waitForTimeout(1000); // This timeout helps ensure that the action is fully processed
    }
    await page.screenshot({ path: '02after-starring.png' });

    // Navigate to the user's starred repositories page
    await page.goto(`https://github.com/${actualUsername}?tab=stars`);


    //  Click on the "Create list" button (with check and debug screenshot)
    const createListButton = await page.$('text=Create list');
    const list_name = "Proj10";
    if (createListButton) {
      await createListButton.click();
      await new Promise(resolve => setTimeout(resolve, 200));
      await page.screenshot({ path: 'zzz.png' });
    } else {
      console.log('Create list button not found!');
      await page.screenshot({ path: '03no-create-list.png' });
      // Optionally, you can exit or throw here if this is critical
    }

    //  Create a list named "Node Libraries"
    // HINT: Wait for the input field and type the list name
    await new Promise(resolve => setTimeout(resolve, 1000));
    const listNameInput = await page.$(`input[placeholder="⭐️ Name this list"]`);
    await page.screenshot({ path: '04before-inp-list.png' });
    if (listNameInput) {
      await listNameInput.type(list_name);
      await new Promise(resolve => setTimeout(resolve, 1000));
    } else {
      console.log('List name input not found!');
      await page.screenshot({ path: '05no-list-name-input.png' });
    }

    // Wait for buttons to become visible
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.screenshot({ path: '06checkcreatebutton.png' });
    // Identify and click the "Create" button
    const createbutton = await page.$(`button:has-text("Create")`);
    if (createbutton) {
      await page.screenshot({ path: '06no-create-button.png' });
      console.log("E");
      await createbutton.click();
      console.log("F");
    } else {
      console.log('Create button not found!');
    }

    // Allow some time for the list creation process
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.screenshot({ path: '07check-list-creation.png' });
    for (const repo of repositories) {
        await page.goto(`https://github.com/${repo}`);

        // Add this repository to the "Node Libraries" list
        // HINT: Open the dropdown, wait for it to load, and find the list by its name
        await page.waitForSelector('details-menu[role="menu"]');
        await page.click('details-menu[role="menu"]');
        await new Promise(resolve => setTimeout(resolve, 1000));
        const lists = await page.$$('.js-user-list-menu-form');

        for (const list of lists) {
          const textHandle = await list.getProperty('innerText');
          const text = await textHandle.jsonValue();
          if (text.includes('Node Libraries')) {
            await list.click();
            break;
          }
          else{
            console.log(`List "Node Libraries" not found for repository ${repo}`);
            await page.screenshot({ path: `08no-node-libraries-list-${repo}.png` });
          }
        }

        // Allow some time for the action to process
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Close the dropdown to finalize the addition to the list
        await page.click('details-menu[role="menu"]');
      }

    // Close the browser
    await browser.close();
})();
