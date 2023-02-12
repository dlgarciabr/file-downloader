const express = require('express');
const fs = require('fs');
const path = require('path');
const playwright = require('playwright-core');

const app = express()
const port = 3000;

// app.get('/', (req, res) => {
//   res.send('Hello World!')
// })

const downloadPath = path.resolve('./download');

app.get('/', async (req, res) => {
  try {
    console.log('Initializing download of file...')
    const filesToRemove = fs.readdirSync(downloadPath);
    if (filesToRemove.length > 0) {
      filesToRemove.forEach(file => {
        fs.unlinkSync(`${downloadPath}/${file[0]}`);
      });
    }

    const browser = await playwright.chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    const client = await context.newCDPSession(page);
    await client.send('Page.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath
    });

    await page.goto('https://www.paperdiorama.com/paper-models/work-machines/john-deere-6615-paper-diorama/');

    // await page.setViewport({ width: 1080, height: 1024 });

    const searchResultSelector = 'div.card-body > div > div > a.download-on-click';
    await page.waitForSelector(searchResultSelector);
    // await page._client.send('Page.setDownloadBehavior', {
    //   behavior: 'allow',
    //   downloadPath: downloadPath
    // });

    console.log(`Initializing download of file...`);

    await page.click(searchResultSelector);



    // const download = await page.waitForEvent("download", {
    //   timeout: 60000
    // });

    process.stdout.write('downloading');

    // const rs = await download.createReadStream()

    await checkDownloadFinished();
    console.log('');
    console.log(`File download has finished!`);
    void browser.close();

    // page.on('download', download => {
    //   console.log(download.suggestedFilename);
    //   res.status(200);
    // })

    const files = fs.readdirSync(downloadPath);
    const filePath = `${downloadPath}/${files[0]}`;
    const rs = fs.createReadStream(filePath);

    if (rs) {
      res.setHeader('Content-Disposition', `attachment; ${files[0]}`);
      rs.pipe(res);
    }
  } catch (error) {
    res.status(200).send({ error: error.message });
  }
});

const checkDownloadFinished = async () => {
  process.stdout.write('.');
  const files = fs.readdirSync(downloadPath);
  if (files.length === 0 || files[0].indexOf('crdownload') > 0) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return checkDownloadFinished();
  }
  return true;
};

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})