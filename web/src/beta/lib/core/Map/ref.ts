import type { RefObject } from "react";

import type { EngineRef, LayersRef } from "./types";
import { TimelineManagerRef } from "./useTimelineManager";
import { FunctionKeys, WrappedRef, wrapRef } from "./utils";

export type MapRef = {
  engine: WrappedRef<EngineRef>;
  layers: WrappedRef<LayersRef>;
  timeline?: TimelineManagerRef;
};

const engineRefKeys: FunctionKeys<EngineRef> = {
  captureScreen: 1,
  changeSceneMode: 1,
  changeSpeed: 1,
  changeTime: 1,
  enableScreenSpaceCameraController: 1,
  flyTo: 1,
  flyToGround: 1,
  getCamera: 1,
  getCameraFovInfo: 1,
  getClock: 1,
  getLocationFromScreen: 1,
  sampleTerrainHeight: 1,
  computeGlobeHeight: 1,
  toXYZ: 1,
  toLngLatHeight: 1,
  convertScreenToPositionOffset: 1,
  isPositionVisible: 1,
  setView: 1,
  toWindowPosition: 1,
  getViewport: 1,
  flyToBBox: 1,
  lookAt: 1,
  lookAtLayer: 1,
  lookHorizontal: 1,
  lookVertical: 1,
  moveBackward: 1,
  moveDown: 1,
  moveForward: 1,
  moveLeft: 1,
  moveOverTerrain: 1,
  moveRight: 1,
  moveUp: 1,
  onClick: 1,
  onDoubleClick: 1,
  onMiddleClick: 1,
  onMiddleDown: 1,
  onMiddleUp: 1,
  onMouseDown: 1,
  onMouseEnter: 1,
  onMouseLeave: 1,
  onMouseMove: 1,
  onMouseUp: 1,
  onRightClick: 1,
  onRightDown: 1,
  onRightUp: 1,
  onWheel: 1,
  orbit: 1,
  pause: 1,
  play: 1,
  requestRender: 1,
  rotateRight: 1,
  tick: 1,
  zoomIn: 1,
  zoomOut: 1,
  changeStart: 1,
  changeStop: 1,
  inViewport: 1,
  onTick: 1,
  removeTickEventListener: 1,
  findFeaturesByIds: 1,
  findFeatureById: 1,
  findComputedFeatureById: 1,
  findComputedFeaturesByIds: 1,
  selectFeatures: 1,
  unselectFeatures: 1,
  pickManyFromViewport: 1,
};

const layersRefKeys: FunctionKeys<LayersRef> = {
  add: 1,
  addAll: 1,
  deleteLayer: 1,
  find: 1,
  findAll: 1,
  findById: 1,
  findByIds: 1,
  findByTagLabels: 1,
  findByTags: 1,
  hide: 1,
  isLayer: 1,
  layers: 1,
  override: 1,
  replace: 1,
  select: 1,
  selectFeatures: 1,
  selectedLayer: 1,
  show: 1,
  walk: 1,
  overriddenLayers: 1,
};

export function mapRef({
  engineRef,
  layersRef,
  timelineManagerRef,
}: {
  engineRef: RefObject<EngineRef>;
  layersRef: RefObject<LayersRef>;
  timelineManagerRef?: TimelineManagerRef;
}): MapRef {
  return {
    engine: wrapRef(engineRef, engineRefKeys),
    layers: wrapRef(layersRef, layersRefKeys),
    timeline: timelineManagerRef,
  };
}
