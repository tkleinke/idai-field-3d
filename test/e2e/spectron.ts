const Application = require('spectron').Application;
const spawn = require('child_process').spawn;
const rimraf = require('rimraf');
var fs = require('fs');

let app = new Application({
    path: './node_modules/.bin/electron',
    args: ['.']
});

app.start().then(() => app.client.sessions()).then(sessions => {

    let i = 0;
    const sessionId = sessions.value[0].id;
    console.log("electron webdriver session id:", sessionId);

    return new Promise(resolve => {
        const protractor = spawn('protractor', [
            'test/e2e/config/protractor-spectron.conf.js',
            //'--params.skip_fail_fast=noff',
            '--seleniumSessionId=' + sessionId
        ]);
        protractor.stdout.setEncoding('utf8');
        protractor.stdout.on('data', data => {
            console.log("stdout:"+data+":stdout\n");

            if (data.indexOf("Failed")!=-1) {
                console.log("taking screenshot")
                app.browserWindow.capturePage().then(function (png) {
                    let stream = fs.createWriteStream('test/e2e-screenshots/'+i+'.png');
                    stream.write(new Buffer(png, 'base64'));
                    stream.end();
                    i++;
                });
            }

            // process.stdout.write(data)
        });
        protractor.stderr.setEncoding('utf8');
        protractor.stderr.on('data', data => {
            console.log("stderr:"+data+":stderr\n");

            app.browserWindow.capturePage().then(function (png) {
                let stream = fs.createWriteStream('test/e2e-screenshots/'+i+'.png');
                stream.write(new Buffer(png, 'base64'));
                stream.end();
                i++;
            });
            // process.stderr.write(data)
        });
        protractor.on('close', code => {

            app.browserWindow.capturePage().then(function (png) {
                let stream = fs.createWriteStream('test/e2e-screenshots/close.png');
                stream.write(new Buffer(png, 'base64'));
                stream.end();
                i++;
            });
            resolve(code)
        });
    });

}).then(code => {

    return app.electron.remote.app.getPath('appData').then(path => {
        console.log("appData", path);
        return new Promise(resolve => rimraf(path + "/idai-field-client", () => resolve(code)));
    });
}).then(code => app.stop().then(() => process.exit(code)))
.catch(err => console.log("error when removing app data", err));
