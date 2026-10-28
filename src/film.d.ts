import type { Scene, Camera, PerspectiveCamera, Vector3, WebGLRenderer, IUniform } from 'three'
export interface FilmPost {
  uniforms: Record<string, IUniform>
  bloom: number; radius: number; threshold: number; streak: number
  shockPoint: Vector3 | null; rayPoint: Vector3 | null; rays: number
}
export interface FilmFrame { caption: string; title: string; subtitle: string; fade: number; shot: number }
export interface Film {
  scene: Scene
  camera: PerspectiveCamera
  update(time: number): FilmFrame
  uniforms: { uCamPos: { value: Vector3 } }
  post: FilmPost
  drawOverlay(context: CanvasRenderingContext2D, camera: Camera, width: number, height: number): void
  shots: { start: number; end: number }[]
  dispose(): void
}
export function createFilm(options: { assetUrl: (path: string) => string; renderer: WebGLRenderer }): Promise<Film>
