'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as http from 'http';

export function activate(context: vscode.ExtensionContext) {

    class TextDocumentContentProvider implements vscode.TextDocumentContentProvider {
        private _onDidChange = new vscode.EventEmitter<vscode.Uri>();

        public provideTextDocumentContent(uri: vscode.Uri): Thenable<string> {
            return new Promise<string>(resolve => {
                GetWorkItem(uri.authority, function(item: Object) {
                    var content = "<style>table {border: 0px}</style>"
                    content += "<body>"
                    content += "<h1>"
                    content += item['fields']['system.title']
                    content += "</h1>"
                    content += "<h14>"
                    content += item['type']
                    content += "</h4>"
                    content += "<hr>"
                    content += "<table>"
                    content += "<tr><th>State</th><td>" + item['fields']['system.state'] + "</td></tr>"
                    content += "<tr><th>Creator</th><td>" + item['fields']['system.creator'] + "</td></tr>"
                    content += "<tr><th>Assignee</th><td>" + item['fields']['system.assignee'] + "</td></tr>"
                    content += "</table>"
                    content += "<hr>"
                    content += "<div>"
                    content += item['fields']['system.description']
                    content += "</div>"

                    content += "</body>"
                    
                                        
                    resolve(content)
                })
            });
        }

        get onDidChange(): vscode.Event<vscode.Uri> {
            return this._onDidChange.event;
        }

        public update(uri: vscode.Uri) {
            this._onDidChange.fire(uri);
        }
    }

    let provider = new TextDocumentContentProvider();
    let registration = vscode.workspace.registerTextDocumentContentProvider('almighty-workitem', provider);

    let disposable = vscode.commands.registerCommand('extension.viewWorkItems', () => {
        vscode.window.showQuickPick(LoadWorkItems(), new WorkItemQuickPickOptions()).then((item: WorkItemQuickPick) => {
            return vscode.commands.executeCommand('vscode.previewHtml', vscode.Uri.parse('almighty-workitem://' + item.id), vscode.ViewColumn.Two, 'Work Items').then((success) => {
            }, (reason) => {
                vscode.window.showErrorMessage(reason);
            });
        })
    });

    context.subscriptions.push(disposable);
}

class WorkItemQuickPick implements vscode.QuickPickItem {
    item: Object;
    
    constructor(item: Object) {
        this.item = item;
    }
    get label(): string {
        return this.item['fields']['system.title']
    }
    get description(): string {
        return this.item['fields']['system.state']
    }
    get detail(): string {
        return this.item['type']
    }
    get id(): string {
        return this.item['id']
    }
}

class WorkItemQuickPickOptions implements vscode.QuickPickOptions {

    get ignoreFocusOut(): boolean {
        return true
    }

    get matchOnDescription(): boolean {
        return true
    }

    get matchOnDetail(): boolean {
        return true
    }

/*
    onDidSelectItem(item: WorkItemQuickPick): any {
        return vscode.commands.executeCommand('vscode.previewHtml', vscode.Uri.parse('almighty-workitem://' + item.id), vscode.ViewColumn.Two, 'Work Items').then((success) => {
        }, (reason) => {
            vscode.window.showErrorMessage(reason);
        });
    }
*/
}


// this method is called when your extension is deactivated
export function deactivate() {
}


function LoadWorkItems(): Thenable<WorkItemQuickPick[]> {
    return new Promise<WorkItemQuickPick[]>(resolve => {
        GetWorkItems(function(items: Object[]) {
          var workItems = new Array<WorkItemQuickPick>();
          for(var i = 0; i < items.length; i++) {
              workItems[i] = new WorkItemQuickPick(items[i])
          }
          resolve(workItems)
        })
    });
}

function GetWorkItems(func) {
    http.get({
        hostname: 'demo.api.almighty.io',
        path: '/api/workitems',
        json: true,
    }, (res) => {
        var body = '';
        res.on('data', function(chunk) {
            body += chunk;
        });
        res.on('end', function() {
            func(JSON.parse(body));
        });
        res.resume();
    })
}

function GetWorkItem(id: string, func) {
    http.get({
        hostname: 'demo.api.almighty.io',
        path: '/api/workitems/' + id,
        json: true,
    }, (res) => {
        var body = '';
        res.on('data', function(chunk) {
            body += chunk;
        });
        res.on('end', function() {
            func(JSON.parse(body));
        });
        res.resume();
    })
}
