const vscode = require('vscode');
const jenkins = require('./jenkins');
const opn = require('opn');
const notifier = require('node-notifier');

let statusBarElement;
let intervalHandler;
let goToUrl;
let config;

function activate(context) {
    statusBarElement = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);

    let goToBranchDisposable = vscode.commands.registerCommand('jenkinsLed.goToBranch', () => {
        opn(goToUrl);
    });

    let startDisposable = vscode.commands.registerCommand('jenkinsLed.start', function () {
        config = getConfiguration();
        
        if (intervalHandler) {
            clearInterval(intervalHandler);
        }
        
        // first call wont wait for the interval
        jenkins.getBranchStatus(config.branchName, updateStatusBar);
        intervalHandler = setInterval(() => {
            config = getConfiguration();
            jenkins.getBranchStatus(config.branchName, updateStatusBar);
        }, config.refreshRate);

        statusBarElement.show();
    });

    let stopDisposable = vscode.commands.registerCommand('jenkinsLed.stop', function () {
        statusBarElement.dispose();
        if (intervalHandler) {
            clearInterval(intervalHandler);
        }
    });

    context.subscriptions.push(startDisposable, stopDisposable, goToBranchDisposable);
    console.log('jenkins led is active');
}

function getConfiguration() {
    return {
        branchName: vscode.workspace.getConfiguration('jenkinsLed').get('branch'),
        refreshRate: vscode.workspace.getConfiguration('jenkinsLed').get('refreshRate')
    }
}

function updateStatusBar(response) {
    let color = response.body.color;
    let text = '$(primitive-dot)';
    let tooltip = color;

    const isInProgress = color.indexOf('anime') > -1;

    if (isInProgress) {
        text = '$(sync)';
        tooltip = 'running';
        color = color.split('_')[0];
    } else if (statusBarElement.text === '$(sync)' && statusBarElement.color === 'red' && color === 'blue') {        
        // branch became stable
        vscode.window.showInformationMessage(`$(flame) ${response.body.displayName} is back in business!`);
        notifier.notify('Message');
    }

    switch (color) {
        case 'blue':
            color = 'green';
            break;
        case 'red':
            color = 'red';
            break;
        default:
            color = 'gray';
    }

    goToUrl = response.body.url;
    statusBarElement.color = color;
    statusBarElement.text = text;
    statusBarElement.tooltip = `Jenkins\n${response.body.displayName} #${response.body.nextBuildNumber}: ${tooltip}`;
    statusBarElement.command = 'jenkinsLed.goToBranch';
}

exports.activate = activate;

function deactivate() {
}

exports.deactivate = deactivate;