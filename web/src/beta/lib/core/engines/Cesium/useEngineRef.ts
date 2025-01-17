import { EllipsoidalOccluder } from "@cesium/engine";
import * as Cesium from "cesium";
import { ClockStep, JulianDate, Math as CesiumMath } from "cesium";
import { useImperativeHandle, Ref, RefObject, useMemo, useRef } from "react";
import { CesiumComponentRef } from "resium";

import { TickEventCallback } from "@reearth/beta/lib/core/Map";

import type { EngineRef, MouseEvents, MouseEvent, Feature, ComputedFeature } from "..";

import {
  getLocationFromScreen,
  flyTo,
  lookAt,
  getCamera,
  getClock,
  lookHorizontal,
  lookVertical,
  moveForward,
  moveBackward,
  moveUp,
  moveDown,
  moveLeft,
  moveRight,
  moveOverTerrain,
  flyToGround,
  getCenterCamera,
  zoom,
  lookAtWithoutAnimation,
  sampleTerrainHeight,
  getCameraEllipsoidIntersection,
  getCameraTerrainIntersection,
  cartesianToLatLngHeight,
} from "./common";
import { attachTag, getTag } from "./Feature";
import { PickedFeature, pickManyFromViewportAsFeature } from "./pickMany";
import {
  convertCesium3DTileFeatureProperties,
  convertEntityDescription,
  convertEntityProperties,
  convertObjToComputedFeature,
  findEntity,
  findFeaturesFromLayer,
} from "./utils";

export default function useEngineRef(
  ref: Ref<EngineRef>,
  cesium: RefObject<CesiumComponentRef<Cesium.Viewer>>,
): EngineRef {
  const cancelCameraFlight = useRef<() => void>();
  const mouseEventCallbacks = useRef<MouseEvents>({
    click: undefined,
    doubleclick: undefined,
    mousedown: undefined,
    mouseup: undefined,
    rightclick: undefined,
    rightdown: undefined,
    rightup: undefined,
    middleclick: undefined,
    middledown: undefined,
    middleup: undefined,
    mousemove: undefined,
    mouseenter: undefined,
    mouseleave: undefined,
    wheel: undefined,
  });
  const tickEventCallback = useRef<TickEventCallback[]>([]);
  const e = useMemo((): EngineRef => {
    return {
      name: "cesium",
      requestRender: () => {
        const viewer = cesium.current?.cesiumElement;
        if (!viewer || viewer.isDestroyed()) return;
        viewer.scene?.requestRender();
      },
      getCamera: () => {
        const viewer = cesium.current?.cesiumElement;
        if (!viewer || viewer.isDestroyed()) return;
        return getCamera(viewer);
      },
      getLocationFromScreen: (x, y, withTerrain) => {
        const viewer = cesium.current?.cesiumElement;
        if (!viewer || viewer.isDestroyed()) return;
        return getLocationFromScreen(viewer.scene, x, y, withTerrain);
      },
      getCameraFovInfo: ({ withTerrain, calcViewSize }) => {
        const viewer = cesium.current?.cesiumElement;
        if (!viewer || viewer.isDestroyed()) return;
        try {
          let center;
          let cartesian;
          let viewSize;
          if (withTerrain) {
            cartesian = getCameraTerrainIntersection(viewer.scene);
            if (cartesian) {
              center = cartesianToLatLngHeight(cartesian, viewer.scene);
            }
          }
          if (!center) {
            cartesian = new Cesium.Cartesian3();
            getCameraEllipsoidIntersection(viewer.scene, cartesian);
            center = cartesianToLatLngHeight(cartesian, viewer.scene);
          }
          if (
            calcViewSize &&
            cartesian &&
            viewer.scene.camera.frustum instanceof Cesium.PerspectiveFrustum
          ) {
            const distance = Cesium.Cartesian3.distance(viewer.scene.camera.positionWC, cartesian);
            viewSize = distance * Math.tan(viewer.scene.camera.frustum.fov / 2);
          }
          return {
            center,
            viewSize,
          };
        } catch (e) {
          return undefined;
        }
      },
      sampleTerrainHeight: async (lng, lat) => {
        const viewer = cesium.current?.cesiumElement;
        if (!viewer || viewer.isDestroyed()) return;
        return await sampleTerrainHeight(viewer.scene, lng, lat);
      },
      computeGlobeHeight: (lng, lat, height) => {
        const viewer = cesium.current?.cesiumElement;
        if (!viewer || viewer.isDestroyed()) return;
        return viewer.scene.globe.getHeight(Cesium.Cartographic.fromDegrees(lng, lat, height));
      },
      toXYZ: (lng, lat, height, options) => {
        const viewer = cesium.current?.cesiumElement;
        if (!viewer || viewer.isDestroyed()) return;
        const cartesian = Cesium.Cartesian3.fromDegrees(
          lng,
          lat,
          height,
          options?.useGlobeEllipsoid ? viewer.scene.globe.ellipsoid : undefined,
        );
        return [cartesian.x, cartesian.y, cartesian.z];
      },
      toLngLatHeight: (x, y, z, options) => {
        const viewer = cesium.current?.cesiumElement;
        if (!viewer || viewer.isDestroyed()) return;
        const cart = Cesium.Cartographic.fromCartesian(
          Cesium.Cartesian3.fromElements(x, y, z),
          options?.useGlobeEllipsoid ? viewer.scene.globe.ellipsoid : undefined,
        );
        return [
          CesiumMath.toDegrees(cart.longitude),
          CesiumMath.toDegrees(cart.latitude),
          cart.height,
        ];
      },
      // Calculate window position from WGS coordinates.
      // TODO: We might need to support other WGS, but it's only WGS84 for now.
      toWindowPosition: (position: [x: number, y: number, z: number]) => {
        const viewer = cesium.current?.cesiumElement;
        if (!viewer || viewer.isDestroyed()) return;
        const result = Cesium.SceneTransforms.wgs84ToWindowCoordinates(
          viewer.scene,
          Cesium.Cartesian3.fromElements(...position),
        );
        return [result.x, result.y];
      },
      // Calculate next positino from screen(window) offset.
      // Ref: https://github.com/takram-design-engineering/plateau-view/blob/6c8225d626cd8085e5d10ffe8980837814c333b0/libs/pedestrian/src/convertScreenToPositionOffset.ts
      convertScreenToPositionOffset: (rawPosition, screenOffset) => {
        const viewer = cesium.current?.cesiumElement;
        if (!viewer || viewer.isDestroyed()) return;

        const position = Cesium.Cartesian3.fromElements(...rawPosition);

        const resultScratch = new Cesium.Cartesian3();
        const cartographicScratch = new Cesium.Cartographic();
        const radiiScratch = new Cesium.Cartesian3();
        const ellipsoidScratch = new Cesium.Ellipsoid();
        const rayScratch = new Cesium.Ray();
        const projectionScratch = new Cesium.Cartesian3();

        const scene = viewer.scene;
        const ellipsoid = scene.globe.ellipsoid;
        let cartographic;
        try {
          cartographic = Cesium.Cartographic.fromCartesian(
            position,
            ellipsoid,
            cartographicScratch,
          );
        } catch (error) {
          return;
        }
        radiiScratch.x = ellipsoid.radii.x + cartographic.height;
        radiiScratch.y = ellipsoid.radii.y + cartographic.height;
        radiiScratch.z = ellipsoid.radii.z + cartographic.height;
        const offsetEllipsoid = Cesium.Ellipsoid.fromCartesian3(radiiScratch, ellipsoidScratch);
        const windowPosition = new Cesium.Cartesian2();
        try {
          [windowPosition.x, windowPosition.y] = e.toWindowPosition(rawPosition) ?? [0, 0];
        } catch (error) {
          return;
        }
        windowPosition.x += screenOffset[0];
        windowPosition.y += screenOffset[1];
        const ray = scene.camera.getPickRay(windowPosition, rayScratch);
        if (ray == null) {
          return;
        }
        const intersection = Cesium.IntersectionTests.rayEllipsoid(ray, offsetEllipsoid);
        if (intersection == null) {
          return;
        }
        const projection = Cesium.Ray.getPoint(ray, intersection.start, projectionScratch);
        const result = Cesium.Cartesian3.subtract(projection, position, resultScratch);
        return [result.x, result.y, result.z];
      },
      // Check if the position is visible on globe.
      isPositionVisible: position => {
        const viewer = cesium.current?.cesiumElement;
        if (!viewer || viewer.isDestroyed()) return false;
        const occluder = new EllipsoidalOccluder(Cesium.Ellipsoid.WGS84, Cesium.Cartesian3.ZERO);
        occluder.cameraPosition = viewer.scene.camera.position;
        return occluder.isPointVisible(Cesium.Cartesian3.fromElements(...position));
      },
      setView: camera => {
        const viewer = cesium.current?.cesiumElement;
        if (!viewer || viewer.isDestroyed()) return false;
        const scene = viewer.scene;
        if (camera.lng || camera.lat || camera.height) {
          const xyz = Cesium.Cartesian3.fromDegrees(camera.lng, camera.lat, camera.height);
          scene.camera.position.x = xyz.x;
          scene.camera.position.y = xyz.y;
          scene.camera.position.z = xyz.z;
        }
        if (camera.heading || camera.pitch) {
          scene.camera.setView({
            orientation: {
              heading: camera.heading,
              pitch: camera.pitch,
            },
          });
        }
        if (camera.fov && scene.camera.frustum instanceof Cesium.PerspectiveFrustum) {
          scene.camera.frustum.fov = camera.fov;
        }
        return;
      },
      flyTo: (target, options) => {
        if (target && typeof target === "object") {
          const viewer = cesium.current?.cesiumElement;
          if (!viewer || viewer.isDestroyed()) return;

          cancelCameraFlight.current?.();
          cancelCameraFlight.current = flyTo(
            viewer.scene?.camera,
            { ...getCamera(viewer), ...target },
            options,
          );
        }
        if (target && typeof target === "string") {
          const viewer = cesium.current?.cesiumElement;
          if (!viewer || viewer.isDestroyed()) return;

          const layerOrFeatureId = target;
          const entityFromFeatureId = findEntity(viewer, layerOrFeatureId, layerOrFeatureId, true);
          const tag = getTag(entityFromFeatureId);
          if (entityFromFeatureId instanceof Cesium.Primitive) {
            viewer.scene.camera.flyToBoundingSphere(
              Cesium.BoundingSphere.fromTransformation(entityFromFeatureId.modelMatrix),
            );
            return;
          }

          // specifically added for HeatMap, consult @pyshx before making changes here
          if (entityFromFeatureId instanceof Cesium.GroundPrimitive) {
            viewer.scene.camera.flyToBoundingSphere(
              tag?.originalProperties as Cesium.BoundingSphere,
            );
            return;
          }

          // `viewer.flyTo` doesn't support Cesium3DTileFeature.
          if (
            entityFromFeatureId &&
            !(
              entityFromFeatureId instanceof Cesium.Cesium3DTileFeature ||
              entityFromFeatureId instanceof Cesium.Cesium3DTilePointFeature ||
              entityFromFeatureId instanceof Cesium.Model ||
              entityFromFeatureId instanceof Cesium.Primitive ||
              entityFromFeatureId instanceof Cesium.GroundPrimitive
            )
          ) {
            viewer.flyTo(entityFromFeatureId, options);
          } else {
            for (const ds of [viewer.dataSourceDisplay.dataSources, viewer.dataSources]) {
              for (let i = 0; i < ds.length; i++) {
                const d = ds.get(i);
                const entities = d.entities.values;
                const e = entities.find(e => getTag(e)?.layerId === layerOrFeatureId);
                if (e) {
                  viewer.flyTo(d, options);
                  return;
                }
              }
            }

            const targets: Cesium.Entity[] = [];
            for (const entity of viewer.entities.values) {
              if (getTag(entity)?.layerId === layerOrFeatureId) {
                targets.push(entity);
              }
            }
            if (targets.length) {
              viewer.flyTo(targets, options);
              return;
            }

            const entityFromLayerId = findEntity(viewer, layerOrFeatureId);

            if (entityFromLayerId instanceof Cesium.Primitive) {
              viewer.scene.camera.flyToBoundingSphere(
                Cesium.BoundingSphere.fromTransformation(entityFromLayerId.modelMatrix),
              );
              return;
            }

            if (
              entityFromLayerId &&
              !(
                entityFromLayerId instanceof Cesium.Cesium3DTileFeature ||
                entityFromLayerId instanceof Cesium.Cesium3DTilePointFeature ||
                entityFromLayerId instanceof Cesium.Model ||
                entityFromLayerId instanceof Cesium.Primitive ||
                entityFromLayerId instanceof Cesium.GroundPrimitive
              )
            ) {
              viewer.flyTo(entityFromLayerId, options);
            }
          }
        }
      },
      flyToBBox: (bbox, options) => {
        const viewer = cesium.current?.cesiumElement;
        if (!viewer || viewer.isDestroyed()) return;

        cancelCameraFlight.current?.();

        const boundingSphere = Cesium.BoundingSphere.fromRectangle3D(
          Cesium.Rectangle.fromDegrees(...bbox),
        );

        const camera = viewer.scene.camera;

        viewer.camera.flyToBoundingSphere(boundingSphere, {
          offset: {
            heading: options?.heading
              ? CesiumMath.toDegrees(options.heading)
              : viewer.scene.camera.heading,
            pitch: options?.pitch ? CesiumMath.toDegrees(options.pitch) : camera.pitch,
            range: options?.range ?? 0,
          },
          duration: options?.duration,
        });

        cancelCameraFlight.current = () => {
          camera?.cancelFlight();
        };
      },
      lookAt: (camera, options) => {
        const viewer = cesium.current?.cesiumElement;
        if (!viewer || viewer.isDestroyed()) return;
        if (options?.withoutAnimation) {
          return lookAtWithoutAnimation(viewer.scene, { ...getCamera(viewer), ...camera });
        }
        cancelCameraFlight.current?.();
        cancelCameraFlight.current = lookAt(
          viewer.scene?.camera,
          { ...getCamera(viewer), ...camera },
          options,
        );
      },
      lookAtLayer: layerId => {
        const viewer = cesium.current?.cesiumElement;
        if (!viewer || viewer.isDestroyed()) return;
        const e = viewer.entities.getById(layerId);
        if (!e) return;
        const entityPos = e.position?.getValue(viewer.clock.currentTime);
        if (!entityPos) return;
        const cameraPos = viewer.camera.positionWC;
        const distance = Cesium.Cartesian3.distance(entityPos, cameraPos);
        if (Math.round(distance * 1000) / 1000 === 5000) return;
        const camera = getCamera(viewer);
        const offset = new Cesium.HeadingPitchRange(
          camera?.heading ?? 0,
          camera?.pitch ?? -90,
          5000,
        );
        viewer.zoomTo(e, offset);
      },
      getViewport: () => {
        const viewer = cesium.current?.cesiumElement;
        if (!viewer || viewer.isDestroyed()) return;
        const rect = viewer.camera.computeViewRectangle();
        return rect
          ? {
              north: CesiumMath.toDegrees(rect.north),
              south: CesiumMath.toDegrees(rect.south),
              west: CesiumMath.toDegrees(rect.west),
              east: CesiumMath.toDegrees(rect.east),
            }
          : undefined;
      },
      zoomIn: (amount, options) => {
        const viewer = cesium.current?.cesiumElement;
        if (!viewer || viewer.isDestroyed()) return;
        zoom({ viewer, relativeAmount: 1 / amount }, options);
      },
      zoomOut: (amount, options) => {
        const viewer = cesium.current?.cesiumElement;
        if (!viewer || viewer.isDestroyed()) return;
        zoom({ viewer, relativeAmount: amount }, options);
      },
      orbit: radian => {
        const viewer = cesium.current?.cesiumElement;
        if (!viewer || viewer.isDestroyed()) return;
        const scene = viewer.scene;
        const camera = scene.camera;

        const distance = 0.02;
        const angle = radian + CesiumMath.PI_OVER_TWO;

        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;

        const oldTransform = Cesium.Matrix4.clone(camera.transform);

        const center = getCenterCamera({ camera, scene });
        // Get fixed frame from center to globe ellipsoid.
        const frame = Cesium.Transforms.eastNorthUpToFixedFrame(
          center || camera.positionWC,
          scene.globe.ellipsoid,
        );

        camera.lookAtTransform(frame);

        if (viewer.scene.mode !== Cesium.SceneMode.SCENE3D) {
          camera.move(
            new Cesium.Cartesian3(x, y, 0),
            (Math.max(scene.canvas.clientWidth, scene.canvas.clientHeight) / 100) *
              camera.positionCartographic.height *
              distance,
          );
        } else if (center) {
          camera.rotateLeft(x);
          camera.rotateUp(y);
        } else {
          camera.look(Cesium.Cartesian3.UNIT_Z, x);
          camera.look(camera.right, y);
        }
        camera.lookAtTransform(oldTransform);
      },
      rotateRight: radian => {
        const viewer = cesium.current?.cesiumElement;
        if (!viewer || viewer.isDestroyed()) return;
        const scene = viewer.scene;
        const camera = scene.camera;
        const oldTransform = Cesium.Matrix4.clone(camera.transform);
        const frame = Cesium.Transforms.eastNorthUpToFixedFrame(
          camera.positionWC,
          scene.globe.ellipsoid,
        );
        if (viewer.scene.mode !== Cesium.SceneMode.SCENE3D) {
          camera.twistRight(radian - -camera.heading);
          camera.twistLeft(radian - -camera.heading);
        } else {
          camera.lookAtTransform(frame);
          camera.rotateRight(radian - -camera.heading);
          camera.lookAtTransform(oldTransform);
        }
      },
      changeSceneMode: (sceneMode, duration = 2) => {
        const viewer = cesium.current?.cesiumElement;
        if (!viewer || viewer.isDestroyed() || !viewer.scene) return;
        switch (sceneMode) {
          case "2d":
            viewer?.scene?.morphTo2D(duration);
            break;
          case "columbus":
            viewer?.scene?.morphToColumbusView(duration);
            break;
          case "3d":
          default:
            viewer?.scene?.morphTo3D(duration);
            break;
        }
      },
      getClock: () => {
        const viewer = cesium.current?.cesiumElement;
        if (!viewer || viewer.isDestroyed() || !viewer.clock) return;
        const clock: Cesium.Clock = viewer.clock;
        return getClock(clock);
      },
      captureScreen: (type?: string, encoderOptions?: number) => {
        const viewer = cesium.current?.cesiumElement;
        if (!viewer || viewer.isDestroyed()) return;
        viewer.scene.requestRender();
        viewer.render();
        return viewer.canvas.toDataURL(type, encoderOptions);
      },
      enableScreenSpaceCameraController: (enabled = true) => {
        const viewer = cesium.current?.cesiumElement;
        if (!viewer || viewer.isDestroyed() || !viewer.scene) return;
        const enable = !!enabled;
        viewer.scene.screenSpaceCameraController.enableRotate = enable;
        viewer.scene.screenSpaceCameraController.enableTranslate = enable;
        viewer.scene.screenSpaceCameraController.enableZoom = enable;
        viewer.scene.screenSpaceCameraController.enableTilt = enable;
        viewer.scene.screenSpaceCameraController.enableLook = enable;
      },
      lookHorizontal: amount => {
        const viewer = cesium.current?.cesiumElement;
        if (!viewer || viewer.isDestroyed() || !viewer.scene || !amount) return;
        lookHorizontal(viewer.scene, amount);
      },
      lookVertical: amount => {
        const viewer = cesium.current?.cesiumElement;
        if (!viewer || viewer.isDestroyed() || !viewer.scene || !amount) return;
        lookVertical(viewer.scene, amount);
      },
      moveForward: amount => {
        const viewer = cesium.current?.cesiumElement;
        if (!viewer || viewer.isDestroyed() || !viewer.scene || !amount) return;
        moveForward(viewer.scene, amount);
      },
      moveBackward: amount => {
        const viewer = cesium.current?.cesiumElement;
        if (!viewer || viewer.isDestroyed() || !viewer.scene || !amount) return;
        moveBackward(viewer.scene, amount);
      },
      moveUp: amount => {
        const viewer = cesium.current?.cesiumElement;
        if (!viewer || viewer.isDestroyed() || !viewer.scene || !amount) return;
        moveUp(viewer.scene, amount);
      },
      moveDown: amount => {
        const viewer = cesium.current?.cesiumElement;
        if (!viewer || viewer.isDestroyed() || !viewer.scene || !amount) return;
        moveDown(viewer.scene, amount);
      },
      moveLeft: amount => {
        const viewer = cesium.current?.cesiumElement;
        if (!viewer || viewer.isDestroyed() || !viewer.scene || !amount) return;
        moveLeft(viewer.scene, amount);
      },
      moveRight: amount => {
        const viewer = cesium.current?.cesiumElement;
        if (!viewer || viewer.isDestroyed() || !viewer.scene || !amount) return;
        moveRight(viewer.scene, amount);
      },
      moveOverTerrain: async offset => {
        const viewer = cesium.current?.cesiumElement;
        if (!viewer || viewer.isDestroyed()) return;
        moveOverTerrain(viewer, offset);
      },
      flyToGround: async (camera, options, offset) => {
        const viewer = cesium.current?.cesiumElement;
        if (!viewer || viewer.isDestroyed()) return;
        flyToGround(viewer, cancelCameraFlight, camera, options, offset);
      },
      onClick: (cb: ((props: MouseEvent) => void) | undefined) => {
        mouseEventCallbacks.current.click = cb;
      },
      onDoubleClick: (cb: ((props: MouseEvent) => void) | undefined) => {
        mouseEventCallbacks.current.doubleclick = cb;
      },
      onMouseDown: (cb: ((props: MouseEvent) => void) | undefined) => {
        mouseEventCallbacks.current.mousedown = cb;
      },
      onMouseUp: (cb: ((props: MouseEvent) => void) | undefined) => {
        mouseEventCallbacks.current.mouseup = cb;
      },
      onRightClick: (cb: ((props: MouseEvent) => void) | undefined) => {
        mouseEventCallbacks.current.rightclick = cb;
      },
      onRightDown: (cb: ((props: MouseEvent) => void) | undefined) => {
        mouseEventCallbacks.current.rightdown = cb;
      },
      onRightUp: (cb: ((props: MouseEvent) => void) | undefined) => {
        mouseEventCallbacks.current.rightup = cb;
      },
      onMiddleClick: (cb: ((props: MouseEvent) => void) | undefined) => {
        mouseEventCallbacks.current.middleclick = cb;
      },
      onMiddleDown: (cb: ((props: MouseEvent) => void) | undefined) => {
        mouseEventCallbacks.current.middledown = cb;
      },
      onMiddleUp: (cb: ((props: MouseEvent) => void) | undefined) => {
        mouseEventCallbacks.current.middleup = cb;
      },
      onMouseMove: (cb: ((props: MouseEvent) => void) | undefined) => {
        mouseEventCallbacks.current.mousemove = cb;
      },
      onMouseEnter: (cb: ((props: MouseEvent) => void) | undefined) => {
        mouseEventCallbacks.current.mouseenter = cb;
      },
      onMouseLeave: (cb: ((props: MouseEvent) => void) | undefined) => {
        mouseEventCallbacks.current.mouseleave = cb;
      },
      onWheel: (cb: ((props: MouseEvent) => void) | undefined) => {
        mouseEventCallbacks.current.wheel = cb;
      },
      mouseEventCallbacks: mouseEventCallbacks.current,
      changeSpeed: (speed: number) => {
        const viewer = cesium.current?.cesiumElement;
        if (!viewer || viewer.isDestroyed()) return;
        viewer.clock.multiplier = speed;
        viewer.clock.clockStep = ClockStep.SYSTEM_CLOCK_MULTIPLIER;
      },
      changeTime: (time: Date) => {
        const viewer = cesium.current?.cesiumElement;
        if (!viewer || viewer.isDestroyed()) return;
        viewer.clock.currentTime = JulianDate.fromDate(time);
      },
      pause: () => {
        const viewer = cesium.current?.cesiumElement;
        if (!viewer || viewer.isDestroyed()) return;
        viewer.clock.shouldAnimate = false;
      },
      play: () => {
        const viewer = cesium.current?.cesiumElement;
        if (!viewer || viewer.isDestroyed()) return;
        viewer.clock.shouldAnimate = true;
      },
      tick: () => {
        const viewer = cesium.current?.cesiumElement;
        if (!viewer || viewer.isDestroyed()) return;
        return JulianDate.toDate(viewer.clock.tick());
      },
      changeStart: (start: Date) => {
        const viewer = cesium.current?.cesiumElement;
        if (!viewer || viewer.isDestroyed()) return;
        viewer.clock.startTime = JulianDate.fromDate(start);
      },
      changeStop: (stop: Date) => {
        const viewer = cesium.current?.cesiumElement;
        if (!viewer || viewer.isDestroyed()) return;
        viewer.clock.stopTime = JulianDate.fromDate(stop);
      },
      inViewport: location => {
        const rect = e.getViewport();
        return !!(
          rect &&
          location &&
          typeof location.lng === "number" &&
          typeof location.lat === "number" &&
          Cesium.Rectangle.contains(
            new Cesium.Rectangle(
              CesiumMath.toRadians(rect.west),
              CesiumMath.toRadians(rect.south),
              CesiumMath.toRadians(rect.east),
              CesiumMath.toRadians(rect.north),
            ),
            Cesium.Cartographic.fromDegrees(location.lng, location.lat),
          )
        );
      },
      findFeatureById: (layerId: string, featureId: string): Feature | undefined => {
        const viewer = cesium.current?.cesiumElement;
        if (!viewer || viewer.isDestroyed()) return;
        const entity = findEntity(viewer, layerId, featureId);
        const tag = getTag(entity);
        if (!tag?.featureId) {
          return;
        }
        if (entity instanceof Cesium.Entity) {
          // TODO: Return description for CZML
          return {
            type: "feature",
            id: tag.featureId,
            properties: convertEntityProperties(viewer.clock.currentTime, entity),
            metaData: {
              description: convertEntityDescription(viewer.clock.currentTime, entity),
            },
          };
        }
        if (
          entity instanceof Cesium.Cesium3DTileFeature ||
          entity instanceof Cesium.Cesium3DTilePointFeature
        ) {
          return {
            type: "feature",
            id: tag.featureId,
            properties: convertCesium3DTileFeatureProperties(entity),
          };
        }
        return;
      },
      findFeaturesByIds: (layerId: string, featureIds: string[]): Feature[] | undefined => {
        const viewer = cesium.current?.cesiumElement;
        if (!viewer || viewer.isDestroyed()) return;
        return findFeaturesFromLayer(viewer, layerId, featureIds, e => {
          const f = convertObjToComputedFeature(viewer.clock.currentTime, e)?.[1];
          return f
            ? ({
                ...f,
                type: "feature",
              } as Feature)
            : undefined;
        });
      },
      findComputedFeatureById: (
        layerId: string,
        featureId: string,
      ): ComputedFeature | undefined => {
        const viewer = cesium.current?.cesiumElement;
        if (!viewer || viewer.isDestroyed()) return;
        const entity = findEntity(viewer, layerId, featureId);
        const tag = getTag(entity);
        if (!tag?.featureId) {
          return;
        }
        if (entity instanceof Cesium.Entity) {
          // TODO: Return description for CZML
          return (
            tag.computedFeature ?? {
              type: "computedFeature",
              id: tag.featureId,
              properties: convertEntityProperties(viewer.clock.currentTime, entity),
              metaData: {
                description: convertEntityDescription(viewer.clock.currentTime, entity),
              },
            }
          );
        }
        if (
          entity instanceof Cesium.Cesium3DTileFeature ||
          entity instanceof Cesium.Cesium3DTilePointFeature
        ) {
          return (
            tag.computedFeature ?? {
              type: "computedFeature",
              id: tag.featureId,
              properties: convertCesium3DTileFeatureProperties(entity),
            }
          );
        }
        return;
      },
      findComputedFeaturesByIds: (
        layerId: string,
        featureIds: string[],
      ): ComputedFeature[] | undefined => {
        const viewer = cesium.current?.cesiumElement;
        if (!viewer || viewer.isDestroyed()) return;
        return findFeaturesFromLayer(
          viewer,
          layerId,
          featureIds,
          e => convertObjToComputedFeature(viewer.clock.currentTime, e)?.[1],
        );
      },
      selectFeatures: (layerId: string, featureId: string[]) => {
        const viewer = cesium.current?.cesiumElement;
        if (!viewer || viewer.isDestroyed()) return;
        findFeaturesFromLayer(viewer, layerId, featureId, entity => {
          const tag = getTag(entity) ?? {};
          const updatedTag = { ...tag, isFeatureSelected: true };
          attachTag(entity, updatedTag);
          return entity;
        });
      },
      unselectFeatures: (layerId: string, featureId: string[]) => {
        const viewer = cesium.current?.cesiumElement;
        if (!viewer || viewer.isDestroyed()) return;
        findFeaturesFromLayer(viewer, layerId, featureId, entity => {
          const tag = getTag(entity) ?? {};
          tag.isFeatureSelected = false;
          attachTag(entity, tag);
          return entity;
        });
      },
      pickManyFromViewport: (
        windowPosition: [x: number, y: number],
        windowWidth: number,
        windowHeight: number,
        // TODO: Get condition as expression for plugin
        condition?: (f: PickedFeature) => boolean,
      ): PickedFeature[] | undefined => {
        const viewer = cesium.current?.cesiumElement;
        if (!viewer || viewer.isDestroyed()) return;
        return pickManyFromViewportAsFeature(
          viewer,
          new Cesium.Cartesian2(windowPosition[0], windowPosition[1]),
          windowWidth,
          windowHeight,
          condition,
        );
      },
      onTick: cb => {
        tickEventCallback.current.push(cb);
      },
      removeTickEventListener: cb => {
        tickEventCallback.current = tickEventCallback.current.filter(c => c !== cb) || [];
      },
      tickEventCallback,
    };
  }, [cesium]);

  useImperativeHandle(ref, () => e, [e]);

  return e;
}
