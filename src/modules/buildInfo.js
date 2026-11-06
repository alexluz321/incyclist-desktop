const fs = require('fs')
const path = require('path')
const { app } = require('electron')
const { getSourceDir } = require('../utils')

// Written into the packaged web bundle (./build) by scripts/update-web-bundle.js
const BUILD_INFO_FILE = 'build-info.json'

function getBuildDir() {
    return path.join(getSourceDir(), '../build')
}

function readBuildInfo(buildDir = getBuildDir()) {
    try {
        return JSON.parse(fs.readFileSync(path.join(buildDir, BUILD_INFO_FILE), 'utf-8')) ?? {}
    }
    catch {
        return {}
    }
}

function writeBuildInfo(buildDir, info) {
    const file = path.join(buildDir, BUILD_INFO_FILE)
    if (info)
        fs.writeFileSync(file, JSON.stringify(info, null, 2))
    else
        fs.rmSync(file, { force: true })
}

// A build packaged with "webUI":"bundled" in config/settings.json always runs the web UI it was packaged with:
// no web bundle is downloaded from the update server and no app updates are installed.
// Only applies to packaged apps, so that `npm run dev` keeps using pageUrl/pageDir from the app settings.
function isBundledWebUI(buildDir) {
    if (!app?.isPackaged)
        return false
    return readBuildInfo(buildDir).webUI === 'bundled'
}

function getBundledPageUrl() {
    return 'file://' + path.join(getBuildDir(), 'index.html') + '#ride'
}

module.exports.BUILD_INFO_FILE = BUILD_INFO_FILE
module.exports.getBuildDir = getBuildDir
module.exports.readBuildInfo = readBuildInfo
module.exports.writeBuildInfo = writeBuildInfo
module.exports.isBundledWebUI = isBundledWebUI
module.exports.getBundledPageUrl = getBundledPageUrl
