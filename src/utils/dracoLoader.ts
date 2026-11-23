import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

let dracoLoaderInstance: DRACOLoader | null = null;

export function getDracoLoader(): DRACOLoader {
  if (!dracoLoaderInstance && typeof window !== "undefined") {
    dracoLoaderInstance = new DRACOLoader();
    dracoLoaderInstance.setDecoderPath("/assets/libs/draco/");
    dracoLoaderInstance.preload();
  }
  return dracoLoaderInstance!;
}

const geometryCache = new Map<string, Promise<THREE.BufferGeometry>>();

export function loadDracoGeometry(url: string): Promise<THREE.BufferGeometry> {
  if (geometryCache.has(url)) {
    return geometryCache.get(url)!;
  }

  const promise = new Promise<THREE.BufferGeometry>((resolve, reject) => {
    const loader = getDracoLoader();
    loader.load(
      url,
      (geometry) => {
        geometry.computeVertexNormals();
        resolve(geometry);
      },
      undefined,
      (error) => {
        console.error(`Failed to load Draco geometry from ${url}:`, error);
        reject(error);
      }
    );
  });

  geometryCache.set(url, promise);
  return promise;
}
