const { Menu } = require('electron')

// macOS only routes Cmd+C/V/X/A/Z to text fields via items of the application menu,
// so without an Edit menu, these shortcuts do nothing.
// Windows/Linux handle the shortcuts natively and don't show an application menu.
function getApplicationMenuTemplate(platform = process.platform) {
    if (platform !== 'darwin')
        return null

    return [
        { role: 'appMenu' },
        { role: 'editMenu' }
    ]
}

function setApplicationMenu(platform = process.platform) {
    const template = getApplicationMenuTemplate(platform)
    Menu.setApplicationMenu(template ? Menu.buildFromTemplate(template) : null)
}

function getContextMenuTemplate(params = {}) {
    const { isEditable, selectionText, editFlags = {} } = params

    if (isEditable) {
        return [
            { role: 'undo', enabled: !!editFlags.canUndo },
            { role: 'redo', enabled: !!editFlags.canRedo },
            { type: 'separator' },
            { role: 'cut', enabled: !!editFlags.canCut },
            { role: 'copy', enabled: !!editFlags.canCopy },
            { role: 'paste', enabled: !!editFlags.canPaste },
            { type: 'separator' },
            { role: 'selectAll', enabled: !!editFlags.canSelectAll }
        ]
    }

    if (selectionText?.trim().length)
        return [{ role: 'copy' }]

    return null
}

// Shows a Cut/Copy/Paste context menu on right-click in text fields (and Copy for selected text)
function attachContextMenu(win) {
    win?.webContents?.on('context-menu', (_event, params) => {
        const template = getContextMenuTemplate(params)
        if (!template)
            return

        Menu.buildFromTemplate(template).popup({ window: win })
    })
}

module.exports.getApplicationMenuTemplate = getApplicationMenuTemplate
module.exports.setApplicationMenu = setApplicationMenu
module.exports.getContextMenuTemplate = getContextMenuTemplate
module.exports.attachContextMenu = attachContextMenu
