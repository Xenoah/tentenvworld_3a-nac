import type { IUniform } from 'three'
import { Pass } from 'three/examples/jsm/postprocessing/Pass.js'
export const filmShader: { uniforms: Record<string, IUniform>; vertexShader: string; fragmentShader: string }
export class StreakPass extends Pass {
  constructor(width: number, height: number)
  strength: number
}
