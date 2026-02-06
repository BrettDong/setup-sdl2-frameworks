# setup-sdl2-frameworks

![CI](https://github.com/BrettDong/setup-sdl2-frameworks/actions/workflows/test.yml/badge.svg) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A GitHub Action to download and install SDL2 frameworks on macOS runners from [libsdl-org](https://github.com/libsdl-org/).

## Usage

Example usage:

```yml
- name: Setup SDL2 frameworks
  uses: BrettDong/setup-sdl2-frameworks@main
  with:
    sdl2: latest
    sdl2-ttf: latest
    sdl2-image: 2.6.3
    sdl2-mixer: none
    sdl2-net: 2.2.0
```

The above configuration will install the specified SDL2 frameworks to the default location on the runner:

```
/Users/runner/Library/Frameworks
├── SDL2.framework        // Latest
│   ├── Headers -> Versions/Current/Headers
│   ├── Resources -> Versions/Current/Resources
│   ├── SDL2 -> Versions/Current/SDL2
│   └── Versions
│       ├── ...
├── SDL2_ttf.framework    // Latest
│   ├── Headers -> Versions/Current/Headers
│   ├── Resources -> Versions/Current/Resources
│   ├── SDL2_ttf -> Versions/Current/SDL2_ttf
│   └── Versions
|       ├── ...
├── SDL2_image.framework  // 2.6.3
│   ├── Headers -> Versions/Current/Headers
│   ├── Resources -> Versions/Current/Resources
│   ├── SDL2_image -> Versions/Current/SDL2_image
│   └── Versions
│       ├── ...
...
```

## Inputs

| Name         | Description                                                   | Default                            |
| ------------ | ------------------------------------------------------------- | ---------------------------------- |
| `dest`       | Destination folder where SDL2 frameworks will be installed to | `/Users/runner/Library/Frameworks` |
| `sdl2`       | SDL2 version to be installed                                  | `latest`                           |
| `sdl2-ttf`   | SDL2_ttf version to be installed                              | `none`                             |
| `sdl2-image` | SDL2_image version to be installed                            | `none`                             |
| `sdl2-mixer` | SDL2_mixer version to be installed                            | `none`                             |
| `sdl2-net`   | SDL2_net version to be installed                              | `none`                             |

## SDL2 Components Version

The version of an SDL2 component to be installed can be specified by
| Value | Description |
|---|---|
| `latest` | Latest release available on GitHub |
| `x.y.z` | A specific version (e.g. `2.6.3`) |
| `none` | Do not install this component |

## Credits

This is developed on top of the template [typescript-action](https://github.com/actions/typescript-action).
