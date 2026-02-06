import * as core from '@actions/core'
import * as github from '@actions/github'
import * as io from '@actions/io'
import * as tc from '@actions/tool-cache'
import * as dmg from 'dmg'
import path from 'path'
import {promisify} from 'util'

interface SDL2Component {
  name: string
  repo: string
  framework: string
}

const sdl2Components: SDL2Component[] = [
  {
    name: 'sdl2',
    repo: 'SDL',
    framework: 'SDL2.framework'
  },
  {
    name: 'sdl2-ttf',
    repo: 'SDL_ttf',
    framework: 'SDL2_ttf.framework'
  },
  {
    name: 'sdl2-image',
    repo: 'SDL_image',
    framework: 'SDL2_image.framework'
  },
  {
    name: 'sdl2-mixer',
    repo: 'SDL_mixer',
    framework: 'SDL2_mixer.framework'
  },
  {
    name: 'sdl2-net',
    repo: 'SDL_net',
    framework: 'SDL2_net.framework'
  }
]

interface Release {
  version: string
  url: string
}

interface Asset {
  name: string
  browser_download_url: string
}

function findDmgAsset(version: string, assets: Asset[]): Release {
  for (const asset of assets) {
    if (asset.name.includes('.dmg')) {
      return {
        version,
        url: asset.browser_download_url
      }
    }
  }
  throw new Error(`Could not find a .dmg asset from the release ${version}`)
}

async function getLatestRelease(component: SDL2Component): Promise<Release> {
  const octokit = github.getOctokit(core.getInput('token'))
  const response = await octokit.rest.repos.getLatestRelease({
    owner: 'libsdl-org',
    repo: component.repo
  })
  const version = response.data.name
  if (version === null) {
    throw new Error('Got empty version name from the latest release')
  }
  return findDmgAsset(version, response.data.assets)
}

async function getSpecifiedRelease(
  component: SDL2Component,
  version: string
): Promise<Release> {
  const octokit = github.getOctokit(core.getInput('token'))
  try {
    const response = await octokit.rest.repos.getReleaseByTag({
      owner: 'libsdl-org',
      repo: component.repo,
      tag: `release-${version}`
    })
    return findDmgAsset(version, response.data.assets)
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'Not Found') {
        core.error(`Could not find ${component.name} version ${version}`)
      }
    }
    throw err
  }
}

async function getRelease(
  component: SDL2Component,
  version: string
): Promise<Release> {
  if (version === 'latest') {
    if (component.name === 'sdl2') {
      return getSpecifiedRelease(component, '2.30.11')
    } else if (component.name === 'sdl2-ttf') {
      return getSpecifiedRelease(component, '2.24.0')
    } else if (component.name === 'sdl2-image') {
      return getSpecifiedRelease(component, '2.8.4')
    }
    return await getLatestRelease(component)
  } else {
    return await getSpecifiedRelease(component, version)
  }
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
  let version: string = core.getInput(component.name)
  if (version === 'none') {
    core.info(`Not installing ${component.name}`)
    return
  }
  const destination: string = core.getInput('dest')
  const release = await getRelease(component, version)
  const url = release.url
  version = release.version
  core.debug(`Downloading from ${url}`)
  const downloaded: string = await tc.downloadTool(url)
  core.debug(`Downloaded to ${downloaded}`)
  const dmgPath = `${downloaded}.dmg`
  await io.mv(downloaded, dmgPath)
  core.debug(`${downloaded} renamed to ${dmgPath}`)
  await extractDmg(dmgPath, component.framework, destination)
  await io.rmRF(dmgPath)
  const finalPath = path.join(destination, component.framework)
  core.info(`Installed ${component.name} ${version} to ${finalPath}`)
}

export async function run(): Promise<void> {
  try {
    await io.mkdirP(core.getInput('dest'))
    for (const component of sdl2Components) {
      await install(component)
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}
