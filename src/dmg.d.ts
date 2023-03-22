declare module 'dmg' {
  export function mount(
    path: string,
    callback: (err: Error, mountedPath: string) => void
  ): void
  export function unmount(path: string, callback: (err: Error) => void): void
}
