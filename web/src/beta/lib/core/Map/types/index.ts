import type {
  ForwardRefExoticComponent,
  PropsWithoutRef,
  RefAttributes,
  ReactNode,
  CSSProperties,
  RefObject,
  MutableRefObject,
} from "react";

import { PickedFeature } from "../../engines/Cesium/pickMany";
import type {
  LatLngHeight,
  Camera,
  Rect,
  LatLng,
  DataType,
  SelectedFeatureInfo,
  Feature,
  ComputedFeature,
  CameraPosition,
} from "../../mantle";
import type { CameraOptions, FlyTo, FlyToDestination, LookAtDestination } from "../../types";
import type {
  FeatureComponentType,
  ClusterComponentType,
  LayerSelectionReason,
  Ref as LayersRef,
} from "../Layers";
import type { TimelineManagerRef } from "../useTimelineManager";

export type {
  FeatureComponentProps,
  FeatureComponentType,
  ClusterComponentType,
  ClusterComponentProps,
  ClusterProperty,
  Ref as LayersRef,
  LayerSelectionReason,
} from "../Layers";
export type {
  Atom,
  DataType,
  DataRange,
  Feature,
  Layer,
  LayerSimple,
  ComputedFeature,
  ComputedLayer,
  Geometry,
  AppearanceTypes,
  Camera,
  Typography,
  LatLng,
  Rect,
  LatLngHeight,
  ValueTypes,
  ValueType,
} from "../../mantle";
export * from "./event";

export type EngineRef = {
  [index in keyof MouseEventHandles]: MouseEventHandles[index];
} & {
  name: string;
  requestRender: () => void;
  getViewport: () => Rect | undefined;
  getCamera: () => Camera | undefined;
  getCameraFovInfo: (options: { withTerrain?: boolean; calcViewSize?: boolean }) =>
    | {
        center?: LatLngHeight;
        viewSize?: number;
      }
    | undefined;
  getLocationFromScreen: (x: number, y: number, withTerrain?: boolean) => LatLngHeight | undefined;
  sampleTerrainHeight: (lng: number, lat: number) => Promise<number | undefined>;
  computeGlobeHeight: (lng: number, lat: number, height?: number) => number | undefined;
  toXYZ: (
    lng: number,
    lat: number,
    height: number,
    options?: { useGlobeEllipsoid?: boolean },
  ) => [x: number, y: number, z: number] | undefined;
  toLngLatHeight: (
    x: number,
    y: number,
    z: number,
    options?: { useGlobeEllipsoid?: boolean },
  ) => [lng: number, lat: number, height: number] | undefined;
  convertScreenToPositionOffset: (
    rawPosition: [x: number, y: number, z: number],
    screenOffset: [x: number, y: number],
  ) => [x: number, y: number, z: number] | undefined;
  isPositionVisible: (position: [x: number, y: number, z: number]) => boolean;
  setView: (camera: CameraPosition) => void;
  toWindowPosition: (
    position: [x: number, y: number, z: number],
  ) => [x: number, y: number] | undefined;
  flyTo: FlyTo;
  flyToBBox: (
    bbox: [number, number, number, number],
    options?: CameraOptions & { heading?: number; pitch?: number; range?: number },
  ) => void;
  lookAt: (destination: LookAtDestination, options?: CameraOptions) => void;
  lookAtLayer: (layerId: string) => void;
  zoomIn: (amount: number, options?: CameraOptions) => void;
  zoomOut: (amount: number, options?: CameraOptions) => void;
  orbit: (radians: number) => void;
  rotateRight: (radians: number) => void;
  changeSceneMode: (sceneMode: SceneMode | undefined, duration?: number) => void;
  getClock: () => Clock | undefined;
  captureScreen: (type?: string, encoderOptions?: number) => string | undefined;
  enableScreenSpaceCameraController: (enabled: boolean) => void;
  lookHorizontal: (amount: number) => void;
  lookVertical: (amount: number) => void;
  moveForward: (amount: number) => void;
  moveBackward: (amount: number) => void;
  moveUp: (amount: number) => void;
  moveDown: (amount: number) => void;
  moveLeft: (amount: number) => void;
  moveRight: (amount: number) => void;
  moveOverTerrain: (offset?: number) => void;
  flyToGround: (destination: FlyToDestination, options?: CameraOptions, offset?: number) => void;
  mouseEventCallbacks: MouseEvents;
  pause: () => void;
  play: () => void;
  changeSpeed: (speed: number) => void;
  changeStart: (start: Date) => void;
  changeStop: (stop: Date) => void;
  changeTime: (time: Date) => void;
  tick: () => Date | void;
  inViewport: (location?: LatLng) => boolean;
  onTick: TickEvent;
  tickEventCallback?: RefObject<TickEventCallback[]>;
  removeTickEventListener: TickEvent;
  findFeatureById: (layerId: string, featureId: string) => Feature | undefined;
  findFeaturesByIds: (layerId: string, featureId: string[]) => Feature[] | undefined;
  findComputedFeatureById: (layerId: string, featureId: string) => ComputedFeature | undefined;
  findComputedFeaturesByIds: (
    layerId: string,
    featureId: string[],
  ) => ComputedFeature[] | undefined;
  selectFeatures: (layerId: string, featureId: string[]) => void;
  unselectFeatures: (layerId: string, featureId: string[]) => void;
  pickManyFromViewport: (
    windowPosition: [x: number, y: number],
    windowWidth: number,
    windowHeight: number,
    // TODO: Get condition as expression for plugin
    condition?: (f: PickedFeature) => boolean,
  ) => PickedFeature[] | undefined;
};

export type EngineProps = {
  className?: string;
  style?: CSSProperties;
  isEditable?: boolean;
  isBuilt?: boolean;
  property?: SceneProperty;
  camera?: Camera;
  small?: boolean;
  children?: ReactNode;
  ready?: boolean;
  selectedLayerId?: {
    layerId?: string;
    featureId?: string;
  };
  featureFlags: number;
  layerSelectionReason?: LayerSelectionReason;
  isLayerDraggable?: boolean;
  isLayerDragging?: boolean;
  shouldRender?: boolean;
  meta?: Record<string, unknown>;
  layersRef?: RefObject<LayersRef>;
  requestingRenderMode?: MutableRefObject<RequestingRenderMode>;
  timelineManagerRef?: TimelineManagerRef;
  onLayerSelect?: (
    layerId: string | undefined,
    featureId?: string,
    options?: LayerSelectionReason,
    info?: SelectedFeatureInfo,
  ) => void;
  onCameraChange?: (camera: Camera) => void;
  onLayerDrag?: (layerId: string, featureId: string | undefined, position: LatLng) => void;
  onLayerDrop?: (
    layerId: string,
    featureId: string | undefined,
    position: LatLng | undefined,
  ) => void;
  onLayerEdit?: (e: LayerEditEvent) => void;
  onMount?: () => void;
};

export type LayerEditEvent = {
  layerId: string | undefined;
  scale?: { width: number; length: number; height: number; location: LatLngHeight };
  rotate?: { heading: number; pitch: number; roll: number };
};

export type Clock = {
  current?: Date;
  start?: Date;
  stop?: Date;
  speed?: number;
  playing?: boolean;
};

export type MouseEvent = {
  x?: number;
  y?: number;
  lat?: number;
  lng?: number;
  height?: number;
  layerId?: string;
  delta?: number;
};

export type MouseEvents = {
  click: ((props: MouseEvent) => void) | undefined;
  doubleclick: ((props: MouseEvent) => void) | undefined;
  mousedown: ((props: MouseEvent) => void) | undefined;
  mouseup: ((props: MouseEvent) => void) | undefined;
  rightclick: ((props: MouseEvent) => void) | undefined;
  rightdown: ((props: MouseEvent) => void) | undefined;
  rightup: ((props: MouseEvent) => void) | undefined;
  middleclick: ((props: MouseEvent) => void) | undefined;
  middledown: ((props: MouseEvent) => void) | undefined;
  middleup: ((props: MouseEvent) => void) | undefined;
  mousemove: ((props: MouseEvent) => void) | undefined;
  mouseenter: ((props: MouseEvent) => void) | undefined;
  mouseleave: ((props: MouseEvent) => void) | undefined;
  wheel: ((props: MouseEvent) => void) | undefined;
};

export type TickEvent = (cb: TickEventCallback) => void;
export type TickEventCallback = (current: Date, clock: { start: Date; stop: Date }) => void;

export type MouseEventHandles = {
  onClick: (fn: MouseEvents["click"]) => void;
  onDoubleClick: (fn: MouseEvents["doubleclick"]) => void;
  onMouseDown: (fn: MouseEvents["mousedown"]) => void;
  onMouseUp: (fn: MouseEvents["mouseup"]) => void;
  onRightClick: (fn: MouseEvents["rightclick"]) => void;
  onRightDown: (fn: MouseEvents["rightdown"]) => void;
  onRightUp: (fn: MouseEvents["rightup"]) => void;
  onMiddleClick: (fn: MouseEvents["middleclick"]) => void;
  onMiddleDown: (fn: MouseEvents["middledown"]) => void;
  onMiddleUp: (fn: MouseEvents["middleup"]) => void;
  onMouseMove: (fn: MouseEvents["mousemove"]) => void;
  onMouseEnter: (fn: MouseEvents["mouseenter"]) => void;
  onMouseLeave: (fn: MouseEvents["mouseleave"]) => void;
  onWheel: (fn: MouseEvents["wheel"]) => void;
};

export type SceneMode = "3d" | "2d" | "columbus";
export type IndicatorTypes = "default" | "crosshair" | "custom";

export type TerrainProperty = {
  terrain?: boolean;
  terrainType?: "cesium" | "arcgis" | "cesiumion"; // default: cesium
  terrainExaggeration?: number; // default: 1
  terrainExaggerationRelativeHeight?: number; // default: 0
  depthTestAgainstTerrain?: boolean;
  terrainCesiumIonAsset?: string;
  terrainCesiumIonAccessToken?: string;
  terrainCesiumIonUrl?: string;
  terrainUrl?: string;
  terrainNormal?: boolean;
};

export type SceneProperty = {
  main?: {
    sceneMode?: SceneMode; // default: scene3d
    ion?: string;
    vr?: boolean;
  };
  tiles?: {
    id: string;
    tile_type?: string;
    tile_url?: string;
    tile_zoomLevel?: number[];
    tile_opacity?: number;
  }[];
  terrain?: {
    terrain?: boolean;
    terrainType?: "cesium" | "arcgis" | "cesiumion"; // default: cesium
    terrainCesiumIonAsset?: string;
    terrainCesiumIonAccessToken?: string;
    terrainCesiumIonUrl?: string;
    terrainExaggeration?: number; // default: 1
    terrainExaggerationRelativeHeight?: number; // default: 0
    depthTestAgainstTerrain?: boolean;
  };
  globeLighting?: {
    globeLighting?: boolean;
  };
  globeShadow?: {
    globeShadow?: boolean;
  };
  globeAtmosphere?: {
    globeAtmosphere?: boolean;
    globeAtmosphereIntensity?: number; // default: 10
  };
  skyBox?: {
    skyBox?: boolean;
  };
  sun?: {
    sun?: boolean;
  };
  moon?: {
    moon?: boolean;
  };
  skyAtmosphere?: {
    skyAtmosphere?: boolean;
    skyAtmosphereIntensity?: number; // default: 50
  };
  camera?: {
    camera?: Camera;
    allowEnterGround?: boolean;
    fov?: number;
  };
  render?: { showWireframe?: boolean };
} & LegacySceneProperty;

type LegacySceneProperty = {
  default?: {
    camera?: Camera;
    allowEnterGround?: boolean;
    skybox?: boolean;
    bgcolor?: string;
    ion?: string;
    sceneMode?: SceneMode; // default: scene3d
    vr?: boolean;
  } & TerrainProperty; // compat
  cameraLimiter?: {
    cameraLimitterEnabled?: boolean;
    cameraLimitterShowHelper?: boolean;
    cameraLimitterTargetArea?: Camera;
    cameraLimitterTargetWidth?: number;
    cameraLimitterTargetLength?: number;
  };
  indicator?: {
    indicator_type: IndicatorTypes;
    indicator_image?: string;
    indicator_image_scale?: number;
  };
  tiles?: {
    id: string;
    tile_type?: string;
    tile_url?: string;
    tile_zoomLevel?: number[];
    tile_opacity?: number;
  }[];
  terrain?: TerrainProperty;
  atmosphere?: {
    enable_sun?: boolean;
    enableMoon?: boolean;
    enable_lighting?: boolean;
    ground_atmosphere?: boolean;
    sky_atmosphere?: boolean;
    shadows?: boolean;
    shadowResolution?: 1024 | 2048 | 4096;
    softShadow?: boolean;
    shadowDarkness?: number;
    shadowMaximumDistance?: number;
    fog?: boolean;
    fog_density?: number;
    hue_shift?: number;
    brightness_shift?: number;
    surturation_shift?: number;
    skyboxBrightnessShift?: number;
    skyboxSurturationShift?: number;
    globeShadowDarkness?: number;
    globeImageBasedLighting?: boolean;
    globeBaseColor?: string;
  };
  timeline?: {
    animation?: boolean;
    visible?: boolean;
    current?: string;
    start?: string;
    stop?: string;
    stepType?: "rate" | "fixed";
    multiplier?: number;
    step?: number;
    rangeType?: "unbounded" | "clamped" | "bounced";
  };
  googleAnalytics?: {
    enableGA?: boolean;
    trackingId?: string;
  };
  theme?: {
    themeType?: "light" | "dark" | "forest" | "custom";
    themeTextColor?: string;
    themeSelectColor?: string;
    themeBackgroundColor?: string;
  };
  ambientOcclusion?: {
    enabled?: boolean;
    quality?: "low" | "medium" | "high" | "extreme";
    intensity?: number;
    ambientOcclusionOnly?: boolean;
  };
  light?: {
    lightType?: "sunLight" | "directionalLight";
    lightDirectionX?: number;
    lightDirectionY?: number;
    lightDirectionZ?: number;
    lightColor?: string;
    lightIntensity?: number;
    specularEnvironmentMaps?: string;
    sphericalHarmonicCoefficients?: [x: number, y: number, z: number][];
    imageBasedLightIntensity?: number;
  };
  render?: {
    antialias?: "low" | "medium" | "high" | "extreme";
    debugFramePerSecond?: boolean;
  };
};

export type EngineComponent = ForwardRefExoticComponent<
  PropsWithoutRef<EngineProps> & RefAttributes<EngineRef>
>;

export type Engine = {
  component: EngineComponent;
  featureComponent: FeatureComponentType;
  clusterComponent: ClusterComponentType;
  delegatedDataTypes?: DataType[];
};

export type RequestingRenderMode = -1 | 0 | 1; // -1: force render on every postUpdate, 0: no request to render, 1: request one frame
