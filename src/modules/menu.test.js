jest.mock('electron', () => ({
    Menu: {
        setApplicationMenu: jest.fn(),
        buildFromTemplate: jest.fn((template) => ({ template, popup: jest.fn() }))
    }
}))

const { Menu } = require('electron')
const { getApplicationMenuTemplate, setApplicationMenu, getContextMenuTemplate, attachContextMenu } = require('./menu')

const roles = (template) => template.filter(item => item.role).map(item => item.role)

describe('menu', () => {

    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('getApplicationMenuTemplate', () => {
        test('macOS gets app and edit menu, so that Cmd+C/V/X/A work', () => {
            expect(roles(getApplicationMenuTemplate('darwin'))).toEqual(['appMenu', 'editMenu'])
        })

        test.each(['win32', 'linux'])('%s gets no application menu', (platform) => {
            expect(getApplicationMenuTemplate(platform)).toBeNull()
        })
    })

    describe('setApplicationMenu', () => {
        test('macOS: sets a menu built from the template', () => {
            setApplicationMenu('darwin')

            expect(Menu.buildFromTemplate).toHaveBeenCalledWith(getApplicationMenuTemplate('darwin'))
            const menu = Menu.setApplicationMenu.mock.calls[0][0]
            expect(roles(menu.template)).toEqual(['appMenu', 'editMenu'])
        })

        test('other platforms: removes the menu', () => {
            setApplicationMenu('win32')

            expect(Menu.buildFromTemplate).not.toHaveBeenCalled()
            expect(Menu.setApplicationMenu).toHaveBeenCalledWith(null)
        })
    })

    describe('getContextMenuTemplate', () => {
        test('editable field: offers undo/redo, cut/copy/paste and select all', () => {
            const template = getContextMenuTemplate({ isEditable: true, editFlags: {} })
            expect(roles(template)).toEqual(['undo', 'redo', 'cut', 'copy', 'paste', 'selectAll'])
        })

        test('editable field: items are enabled according to edit flags', () => {
            const editFlags = { canUndo: false, canRedo: false, canCut: false, canCopy: false, canPaste: true, canSelectAll: true }
            const template = getContextMenuTemplate({ isEditable: true, editFlags })

            const enabled = Object.fromEntries(template.filter(i => i.role).map(i => [i.role, i.enabled]))
            expect(enabled).toEqual({ undo: false, redo: false, cut: false, copy: false, paste: true, selectAll: true })
        })

        test('selected text outside of a field: offers copy', () => {
            expect(roles(getContextMenuTemplate({ isEditable: false, selectionText: 'some text' }))).toEqual(['copy'])
        })

        test.each([
            [{}],
            [{ isEditable: false, selectionText: '' }],
            [{ isEditable: false, selectionText: '   ' }],
            [undefined]
        ])('nothing to edit or copy: no menu (%o)', (params) => {
            expect(getContextMenuTemplate(params)).toBeNull()
        })
    })

    describe('attachContextMenu', () => {
        let win
        let onContextMenu

        beforeEach(() => {
            win = { webContents: { on: jest.fn((event, cb) => { onContextMenu = cb }) } }
            attachContextMenu(win)
        })

        test('registers for the context-menu event', () => {
            expect(win.webContents.on).toHaveBeenCalledWith('context-menu', expect.any(Function))
        })

        test('right-click in a text field shows the menu in that window', () => {
            onContextMenu({}, { isEditable: true, editFlags: { canPaste: true } })

            const menu = Menu.buildFromTemplate.mock.results[0].value
            expect(menu.popup).toHaveBeenCalledWith({ window: win })
        })

        test('right-click without anything to edit or copy shows no menu', () => {
            onContextMenu({}, { isEditable: false, selectionText: '' })

            expect(Menu.buildFromTemplate).not.toHaveBeenCalled()
        })

        test('does not fail without a window', () => {
            expect(() => attachContextMenu(undefined)).not.toThrow()
        })
    })
})
