const util = require('util');
const exec = util.promisify(require('child_process').exec);
const datum = require('./testdatajson');
const fs = require('fs');
const path = require('path');
require('dotenv').config()

const result = datum.body;
const url = datum.media;
const title = datum.title;
const date = datum.date;
const tags = datum.tags;
const category = datum.categories;
const speakers = datum.speakers;
const username = "xyz";//"github-username"; <-- uncomment this and replace with your authenticated username to test. this will later be replace with the reviewer's github username
const pr = true;


function writeToFile(result, url, title, date, tags, category, speakers, videoTitle, username, local, test, pr) {
  try {
    let transcribedText = result;
    let fileTitle;
    if (title) {
      fileTitle = title;
    } else {
      fileTitle = videoTitle;
    }

    let metaData = `---\n` +
                   `title: ${fileTitle}\n` +
                   `transcript_by: ${username} via TBTBTC v3\n`;

    if (!local) {
      metaData += `media: ${url}\n`;
    }

    if (tags) {
      tags = tags.trim();
      tags = tags.split(",");
      for (let i = 0; i < tags.length; i++) {
        tags[i] = tags[i].trim();
      }
      metaData += `tags: ${tags}\n`;
    }

    if (speakers) {
      speakers = speakers.trim();
      speakers = speakers.split(",");
      for (let i = 0; i < speakers.length; i++) {
        speakers[i] = speakers[i].trim();
      }
      metaData += `speakers: ${speakers}\n`;
    }

    if (category) {
      category = category.trim();
      category = category.split(",");
      for (let i = 0; i < category.length; i++) {
        category[i] = category[i].trim();
      }
      metaData += `categories: ${category}\n`;
    }

    const dir = './tmp';

    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
        console.log("Folder tmp created successfully");
      }
    const fileName = title.replace(/ /g, '-');
    const fileNameWithExt = `${path.resolve('.')}/tmp/${fileName}.md`;

    if (date) {
      metaData = metaData + `date: ${date}\n\n`;
    }

    metaData += `---\n`;

    console.log("writing .md file");
    fs.appendFileSync(fileNameWithExt, `${metaData}\n${transcribedText}\n`);

    if (local) {
      url = null;
    }


    return fileNameWithExt;

  } catch (error) {
    console.error("Error writing to file");
    console.error(error);
  }
}


async function createPR(absolute_path, loc, username, curr_time, title,access_token) {
  const branch_name = loc.replace("/", "-");
  try {
    const { stdout, stderr } = await exec(`bash initializeRepo.sh ${absolute_path} ${loc} ${branch_name} ${username} ${curr_time} ${access_token}`);
    console.log('stdout:', stdout);
    console.error('stderr:', stderr);

    const { stdout: stdout2, stderr: stderr2 } = await exec(`bash github.sh ${branch_name} ${username} ${curr_time} ${title}`);
    console.log('stdout:', stdout2);
    console.error('stderr:', stderr2);

    console.log("Please check the PR for the transcription.");
  } catch (err) {
    console.error(err);
  }
}
const absolutePath = writeToFile(result, url, title, date, tags, category, speakers,username,pr);
console.log(absolutePath);

const loc = 'transcription-queue/testfolder';
const currTime = Math.round(Date.now());
const accessToken = process.env.GITHUB_ACCESS_TOKEN;

createPR(absolutePath, loc, username, currTime, title,accessToken);

