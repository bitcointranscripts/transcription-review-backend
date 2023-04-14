## LOGIC

- Once a review is done and submitted, it's time to open a PR
    - Get the content field of the transcript's JSON payload
    - Write it to an md file inside a `tmp` folder -> refer to `writeToFile` function in `samplepr.js`
    - Setup necessary github details -> refer to `initializeRepo.sh` and `github.sh` bash scripts in api folder
    - Create a pr by adding the md file to the `bitcointranscripts/testfolder` in the current working directory
    - remove committed md file from `tmp` folder
- Currently the pull requests are opened against a fork of the bitcointranscripts repo (am not sure this is the intended workflow but i found it effective for test purposes
since in that case we are not spamming the upstream


-   Inside the api folder:
    - Replace the `username` in `samplepr.js` with your authenticated github username
    - Run `node samplepr.js`
    - Add an access token in the .env file
