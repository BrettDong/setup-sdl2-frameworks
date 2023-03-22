import * as core from '@actions/core'
import * as io from '@actions/io'
import * as tc from '@actions/tool-cache'
import * as dmg from 'dmg'
import path from 'path'
import {promisify} from 'util'
interface SDL2Component {
  name: string
  repo: string
  framework: string
  dmg: string
}

const sdl2Components: SDL2Component[] = [
  {
    name: 'sdl2',
    repo: 'SDL',
    framework: 'SDL2.framework',
    dmg: 'SDL2'
  },
  {
    name: 'sdl2-ttf',
    repo: 'SDL_ttf',
    framework: 'SDL2_ttf.framework',
    dmg: 'SDL2_ttf'
  },
  {
    name: 'sdl2-image',
    repo: 'SDL_image',
    framework: 'SDL2_image.framework',
    dmg: 'SDL2_image'
  },
  {
    name: 'sdl2-mixer',
    repo: 'SDL_mixer',
    framework: 'SDL2_mixer.framework',
    dmg: 'SDL2_mixer'
  }
]

function getDownloadURL(component: SDL2Component, version: string): string {
  return `https://github.com/libsdl-org/${component.repo}/releases/download/release-${version}/${component.dmg}-${version}.dmg`
}

async function mountDmg(dmgPath: string): Promise<string> {
  const mount = promisify(dmg.mount)
  core.debug(`Mounting DMG image ${dmgPath}`)
  const mountPath = await mount(dmgPath)
  core.debug(`DMG image ${dmgPath} mounted to ${mountPath}`)
  return mountPath
}

async function unmountDmg(mountPath: string): Promise<void> {
  const unmount = promisify(dmg.unmount)
  await unmount(mountPath)
  core.debug(`Unmounted ${mountPath}`)
}

async function extractDmg(
  dmgPath: string,
  frameworkDir: string,
  dest: string
): Promise<void> {
  const mountPath = await mountDmg(dmgPath)
  const sourcePath = path.join(mountPath, frameworkDir)
  await io.cp(sourcePath, dest, {
    recursive: true
  })
  core.debug(`Copied ${sourcePath} to ${dest}`)
  await unmountDmg(mountPath)
}

async function install(component: SDL2Component): Promise<void> {
  const version: string = core.getInput(component.name)
  if (version === 'none') {
    core.info(`Not installing ${component.name}`)
    return
  }
  const destination: string = core.getInput('dest')
  core.info(`Installing ${component.name} ${version}`)
  const url: string = getDownloadURL(component, version)
  core.debug(`Downloading from ${url}`)
  const downloaded: string = await tc.downloadTool(url)
  core.debug(`Downloaded to ${downloaded}`)
  const dmgPath = `${downloaded}.dmg`
  await io.mv(downloaded, dmgPath)
  core.debug(`${downloaded} renamed to ${dmgPath}`)
  await extractDmg(dmgPath, component.framework, destination)
  const finalPath = path.join(destination, component.framework)
  core.info(`Installed ${component.name} ${version} to ${finalPath}`)
}

async function run(): Promise<void> {
  try {
    await io.mkdirP(core.getInput('dest'))
    for (const component of sdl2Components) {
      await install(component)
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
