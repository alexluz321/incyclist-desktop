const fs = require('fs')
const os = require('os')
const path = require('path')
const { app } = require('electron')
const { BUILD_INFO_FILE, readBuildInfo, writeBuildInfo, isBundledWebUI, getBundledPageUrl, getBuildDir } = require('./buildInfo')

describe('buildInfo', () => {

    let buildDir

    beforeEach(() => {
        buildDir = fs.mkdtempSync(path.join(os.tmpdir(), 'incyclist-build-'))
    })

    afterEach(() => {
        fs.rmSync(buildDir, { recursive: true, force: true })
        delete app.isPackaged
    })

    describe('writeBuildInfo / readBuildInfo', () => {
        test('writes and reads the build info', () => {
            writeBuildInfo(buildDir, { webUI: 'bundled' })

            expect(fs.existsSync(path.join(buildDir, BUILD_INFO_FILE))).toBe(true)
            expect(readBuildInfo(buildDir)).toEqual({ webUI: 'bundled' })
        })

        test('writing without info removes a previous build info', () => {
            writeBuildInfo(buildDir, { webUI: 'bundled' })
            writeBuildInfo(buildDir, undefined)

            expect(fs.existsSync(path.join(buildDir, BUILD_INFO_FILE))).toBe(false)
        })

        test('removing a non-existing build info does not fail', () => {
            expect(() => writeBuildInfo(buildDir, undefined)).not.toThrow()
        })

        test('missing or invalid file is read as empty build info', () => {
            expect(readBuildInfo(buildDir)).toEqual({})

            fs.writeFileSync(path.join(buildDir, BUILD_INFO_FILE), 'not json')
            expect(readBuildInfo(buildDir)).toEqual({})
        })
    })

    describe('isBundledWebUI', () => {
        test('packaged app with bundled web UI', () => {
            app.isPackaged = true
            writeBuildInfo(buildDir, { webUI: 'bundled' })

            expect(isBundledWebUI(buildDir)).toBe(true)
        })

        test('packaged app without build info', () => {
            app.isPackaged = true

            expect(isBundledWebUI(buildDir)).toBe(false)
        })

        test('packaged app with other web UI setting', () => {
            app.isPackaged = true
            writeBuildInfo(buildDir, { webUI: 'download' })

            expect(isBundledWebUI(buildDir)).toBe(false)
        })

        test('not packaged (npm run dev): ignores build info', () => {
            app.isPackaged = false
            writeBuildInfo(buildDir, { webUI: 'bundled' })

            expect(isBundledWebUI(buildDir)).toBe(false)
        })
    })

    describe('getBundledPageUrl', () => {
        test('points to index.html of the packaged web bundle', () => {
            expect(getBundledPageUrl()).toBe('file://' + path.join(getBuildDir(), 'index.html') + '#ride')
        })
    })
})
