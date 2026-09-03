import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  Heart,
  Layers,
  Loader2,
  RotateCcw,
  Sparkles,
  Thermometer,
  Wind,
  Zap
} from 'lucide-react';
import { VitalRecord } from '../../types';

interface Body3DVisualizationProps {
  patientName: string;
  patientStatus: string;
  vitals: VitalRecord;
  onVitalsChange?: (updatedVitals: Partial<VitalRecord>) => void;
}

type AnatomyView = 'DIGITAL_TWIN' | 'SKIN' | 'INTERNAL';
type OrganKey = 'HEART' | 'LUNGS' | 'LIVER' | 'VESSELS' | 'TEMP';
type ModelKey = 'SKIN' | 'HEART' | 'LUNGS' | 'LIVER' | 'VESSELS';
type StatusLevel = 'NORMAL' | 'WARNING' | 'CRITICAL';

interface ModelDefinition {
  key: ModelKey;
  path: string;
  label: string;
}

interface MaterialState {
  material: THREE.MeshPhysicalMaterial;
  baseColor: THREE.Color;
  vesselKind?: 'ARTERY' | 'VEIN' | 'OTHER';
}

interface ModelState {
  key: ModelKey;
  wrapper: THREE.Group;
  materials: MaterialState[];
  // Mesh references for this model, kept so occlusion tests (e.g. "is the
  // heart anchor currently hidden behind the skin?") can raycast against the
  // real anatomy instead of a proxy shape.
  meshes: THREE.Mesh[];
}

const MODEL_DEFINITIONS: ModelDefinition[] = [
  { key: 'SKIN', path: '/models/VH_M_Skin.glb', label: 'skin' },
  { key: 'HEART', path: '/models/VH_M_Heart.glb', label: 'heart' },
  { key: 'LUNGS', path: '/models/VH_M_Lung.glb', label: 'lungs' },
  { key: 'LIVER', path: '/models/VH_M_Liver.glb', label: 'liver' },
  { key: 'VESSELS', path: '/models/VH_M_Blood_Vasculature.glb', label: 'blood vasculature' }
];

const MODEL_COLORS: Record<ModelKey, number> = {
  SKIN: 0xd7a083,
  HEART: 0x9f3d4d,
  LUNGS: 0xb96d78,
  LIVER: 0x71362b,
  VESSELS: 0xc94b51
};

// The five organ/region callouts this view supports. Kept as a plain array
// (rather than re-deriving from OrganKey) so the callout system has one
// single, explicit source of truth for iteration order.
const CALLOUT_KEYS: OrganKey[] = ['HEART', 'LUNGS', 'LIVER', 'VESSELS', 'TEMP'];

// Fixed screen-space "fan out" direction per organ, used only to decide
// which way a label sits relative to its own anchor point. This is NOT a
// screen position (nothing here is a percentage of the canvas) — it's a
// per-organ bias so five anchors that are all clustered near the body's
// vertical centerline (heart/lungs/liver/vessels/temp are all roughly on
// the torso midline) don't all get pushed toward the same corner and
// collide. The anchor itself still comes entirely from the live 3D
// projection; only the *label's* offset direction from that anchor is
// fixed per-organ.
const LABEL_DIRECTIONS: Record<OrganKey, { x: number; y: number }> = {
  LUNGS: { x: -1, y: -0.7 },
  HEART: { x: 1, y: -0.55 },
  LIVER: { x: -1, y: 0.25 },
  VESSELS: { x: 1, y: 0.4 },
  TEMP: { x: -0.3, y: 1 }
};

function statusForVitals(vitals: VitalRecord) {
  const heart: StatusLevel =
    vitals.heartRate >= 130 || vitals.heartRate <= 50
      ? 'CRITICAL'
      : vitals.heartRate > 100
        ? 'WARNING'
        : 'NORMAL';
  const lungs: StatusLevel = vitals.spo2 <= 90 ? 'CRITICAL' : vitals.spo2 < 95 ? 'WARNING' : 'NORMAL';
  const vessels: StatusLevel =
    vitals.systolic >= 160 || vitals.diastolic >= 100
      ? 'CRITICAL'
      : vitals.systolic >= 140
        ? 'WARNING'
        : 'NORMAL';
  const temperature: StatusLevel =
    vitals.temperature >= 38.5 || vitals.temperature <= 35
      ? 'CRITICAL'
      : vitals.temperature > 37.5
        ? 'WARNING'
        : 'NORMAL';

  return { heart, lungs, vessels, temperature };
}

function statusColor(status: StatusLevel, normal: number): number {
  if (status === 'CRITICAL') return 0xf43f5e;
  if (status === 'WARNING') return 0xf59e0b;
  return normal;
}

// Callout leader-line / endpoint colour for a given organ, driven by the
// same live status used to drive the organ's own emissive glow — so the
// label, line and anatomy always agree on severity.
function calloutColor(key: OrganKey, statuses: ReturnType<typeof statusForVitals>): string {
  if (key === 'HEART') {
    return statuses.heart === 'CRITICAL' ? '#fb7185' : statuses.heart === 'WARNING' ? '#fbbf24' : '#22d3ee';
  }
  if (key === 'LUNGS') {
    return statuses.lungs === 'CRITICAL' ? '#fb7185' : statuses.lungs === 'WARNING' ? '#fbbf24' : '#22d3ee';
  }
  if (key === 'VESSELS') {
    return statuses.vessels === 'CRITICAL' ? '#fb7185' : statuses.vessels === 'WARNING' ? '#fbbf24' : '#22d3ee';
  }
  if (key === 'TEMP') {
    return statuses.temperature === 'CRITICAL' ? '#fb7185' : statuses.temperature === 'WARNING' ? '#fbbf24' : '#f59e0b';
  }
  // LIVER has no dedicated vital in this record — neutral, always-on cyan.
  return '#22d3ee';
}

function sourceMaterialName(material: THREE.Material): string {
  return ((material as THREE.Material & { name?: string }).name || '').toLowerCase();
}

function makeControllableMaterial(
  original: THREE.Material,
  key: ModelKey
): MaterialState {
  const source = original as THREE.MeshStandardMaterial & {
    map?: THREE.Texture | null;
    normalMap?: THREE.Texture | null;
    roughnessMap?: THREE.Texture | null;
    metalnessMap?: THREE.Texture | null;
    aoMap?: THREE.Texture | null;
    color?: THREE.Color;
    roughness?: number;
    metalness?: number;
  };
  const sourceName = sourceMaterialName(original);
  const baseColor = new THREE.Color(MODEL_COLORS[key]);
  let vesselKind: MaterialState['vesselKind'];

  if (key === 'VESSELS') {
    vesselKind = sourceName.includes('arter') ? 'ARTERY' : sourceName.includes('vein') ? 'VEIN' : 'OTHER';
    baseColor.set(vesselKind === 'VEIN' ? 0x3197c2 : vesselKind === 'ARTERY' ? 0xb93d4b : 0x4eabc4);
  }

  const material = new THREE.MeshPhysicalMaterial({
    color: baseColor,
    map: source.map ?? null,
    normalMap: source.normalMap ?? null,
    roughnessMap: source.roughnessMap ?? null,
    metalnessMap: source.metalnessMap ?? null,
    aoMap: source.aoMap ?? null,
    roughness: key === 'SKIN' ? 0.58 : source.roughness ?? 0.48,
    metalness: 0,
    transparent: true,
    opacity: 1,
    side: key === 'SKIN' ? THREE.DoubleSide : THREE.FrontSide,
    depthWrite: key !== 'SKIN',
    depthTest: key !== 'SKIN',
    clearcoat: key === 'SKIN' ? 0.08 : 0.04,
    clearcoatRoughness: 0.62
  });

  if (key === 'SKIN') {
    material.sheen = 0.3;
    material.sheenColor = new THREE.Color(0xffd8c4);
    material.sheenRoughness = 0.66;
    material.transmission = 0.08;
    material.thickness = 0.22;
  } else {
    if (key === 'LUNGS') {
      material.transmission = 0.08;
      material.thickness = 0.14;
    }
  }

  // The HuBMAP textures remain attached, while the neutral palette prevents
  // the imported anatomical assets from rendering as a white mannequin.
  if (source.color && key !== 'SKIN') {
    material.color.copy(baseColor);
  }
  material.emissive.set(0x000000);
  material.emissiveIntensity = 0;

  return { material, baseColor, vesselKind };
}

function disposeObject(root: THREE.Object3D, textures: Set<THREE.Texture>) {
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;

    mesh.geometry?.dispose();
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.forEach((material) => {
      const candidate = material as THREE.Material & Record<string, unknown>;
      ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap'].forEach((key) => {
        const texture = candidate[key] as THREE.Texture | undefined;
        if (texture) textures.add(texture);
      });
      material.dispose();
    });
  });
}

function loadModel(
  loader: GLTFLoader,
  definition: ModelDefinition,
  onProgress: (event: ProgressEvent<EventTarget>) => void
): Promise<GLTF> {
  return new Promise((resolve, reject) => {
    loader.load(definition.path, resolve, onProgress, reject);
  });
}

// Returns the WORLD-space center of a model's bounding box (plus an optional
// anatomical offset), or null if the model failed to load. Because
// `model.wrapper` lives inside `digitalTwinGroup` in the scene graph,
// `Box3.setFromObject` already resolves world matrices for every mesh in the
// hierarchy — so as long as the group's matrixWorld is current (it is,
// immediately after `fitDigitalTwin()`), this is a true anatomical anchor
// point, not a screen-space guess.
function getModelAnchor(
  model: ModelState | undefined,
  offset: THREE.Vector3 = new THREE.Vector3()
): THREE.Vector3 | null {
  if (!model) return null;
  const box = new THREE.Box3().setFromObject(model.wrapper);
  if (box.isEmpty()) return null;
  const center = box.getCenter(new THREE.Vector3());
  center.add(offset);
  return center;
}

export const Body3DVisualization: React.FC<Body3DVisualizationProps> = ({
  patientName,
  patientStatus,
  vitals,
  onVitalsChange
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedOrgan, setSelectedOrgan] = useState<OrganKey>('HEART');
  const [anatomyView, setAnatomyView] = useState<AnatomyView>('DIGITAL_TWIN');
  const [autoRotate, setAutoRotate] = useState(true);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [missingParts, setMissingParts] = useState<ModelKey[]>([]);

  const vitalsRef = useRef(vitals);
  const selectedOrganRef = useRef(selectedOrgan);
  const anatomyViewRef = useRef(anatomyView);
  const autoRotateRef = useRef(autoRotate);

  // --- 3D-anchored callout system state ----------------------------------
  // Anchor points are stored once (in digitalTwinGroup's LOCAL space) after
  // the models finish loading and the group's fit-to-view transform is
  // applied. Every frame they're re-projected to screen space via the live
  // camera + group.matrixWorld — never via CSS percentages. Positions are
  // written straight to the DOM/SVG via refs so rotating/zooming/resizing
  // never triggers a React re-render just to move a label.
  const anchorLocalRef = useRef<Record<OrganKey, THREE.Vector3 | null>>({
    HEART: null,
    LUNGS: null,
    LIVER: null,
    VESSELS: null,
    TEMP: null
  });
  const calloutElRefs = useRef<
    Record<OrganKey, { label: HTMLButtonElement | null; line: SVGLineElement | null; circle: SVGCircleElement | null }>
  >({
    HEART: { label: null, line: null, circle: null },
    LUNGS: { label: null, line: null, circle: null },
    LIVER: { label: null, line: null, circle: null },
    VESSELS: { label: null, line: null, circle: null },
    TEMP: { label: null, line: null, circle: null }
  });

  useEffect(() => {
    vitalsRef.current = vitals;
  }, [vitals]);

  useEffect(() => {
    selectedOrganRef.current = selectedOrgan;
  }, [selectedOrgan]);

  useEffect(() => {
    anatomyViewRef.current = anatomyView;
  }, [anatomyView]);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  const vitalStatus = statusForVitals(vitals);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || 550;
    let height = container.clientHeight || 520;
    let disposed = false;
    let animationFrameId = 0;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);
    scene.fog = new THREE.FogExp2(0x020617, 0.042);

    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
    camera.position.set(0, 1.25, 3.85);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.04;
    renderer.setClearColor(0x020617, 0);
    if ('outputColorSpace' in renderer) {
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    }
    container.appendChild(renderer.domElement);
    renderer.domElement.style.touchAction = 'none';

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const environment = new RoomEnvironment();
    scene.environment = pmremGenerator.fromScene(environment, 0.035).texture;

    const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.58);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffeee3, 1.55);
    keyLight.position.set(2.4, 3.5, 3.5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.bias = -0.001;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xb9d9ff, 0.64);
    fillLight.position.set(-2.8, 1.8, 2.2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x27d3c2, 1.0);
    rimLight.position.set(-1.4, 2.5, -3.8);
    scene.add(rimLight);

    const gridHelper = new THREE.GridHelper(5.5, 22, 0x0e7490, 0x10243b);
    const gridMaterials = Array.isArray(gridHelper.material) ? gridHelper.material : [gridHelper.material];
    gridMaterials.forEach((material) => {
      material.transparent = true;
      material.opacity = 0.14;
    });
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    // A light, rather than a proxy mesh, supplies the localized temperature cue.
    const heatLight = new THREE.PointLight(0xf97316, 0, 2.25);
    heatLight.position.set(0, 1.5, 0.35);
    scene.add(heatLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.enableRotate = false;
    controls.minDistance = 2.25;
    controls.maxDistance = 6.5;
    controls.minPolarAngle = Math.PI * 0.16;
    controls.maxPolarAngle = Math.PI * 0.84;
    controls.target.set(0, 1.05, 0);
    controls.update();

    const digitalTwinGroup = new THREE.Group();
    digitalTwinGroup.name = 'digitalTwinGroup';
    scene.add(digitalTwinGroup);

    const modelStates: ModelState[] = [];
    const textureSet = new Set<THREE.Texture>();
    const loader = new GLTFLoader();
    let completedModels = 0;

    const registerModel = (definition: ModelDefinition, gltf: GLTF) => {
      const wrapper = new THREE.Group();
      wrapper.name = `${definition.label.replace(/\s+/g, '')}Model`;
      wrapper.userData.modelKey = definition.key;

      const modelRoot = gltf.scene;
      modelRoot.name = `${definition.key.toLowerCase()}Asset`;
      const sourceBox = new THREE.Box3().setFromObject(modelRoot);
      const sourceCenter = sourceBox.getCenter(new THREE.Vector3());

      // Each asset is already in the HuBMAP common anatomical coordinate
      // system. Wrapping at its own center enables subtle animation without
      // changing the shared alignment of the five models.
      modelRoot.position.sub(sourceCenter);
      wrapper.position.copy(sourceCenter);
      wrapper.add(modelRoot);
      digitalTwinGroup.add(wrapper);

      const materials: MaterialState[] = [];
      const meshes: THREE.Mesh[] = [];
      modelRoot.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh) return;

        mesh.castShadow = definition.key !== 'SKIN';
        mesh.receiveShadow = definition.key !== 'SKIN';
        mesh.renderOrder = definition.key === 'SKIN' ? 30 : 10;
        mesh.userData.modelKey = definition.key;
        const sourceMaterials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        const converted = sourceMaterials.map((material) => {
          const state = makeControllableMaterial(material, definition.key);
          materials.push(state);
          return state.material;
        });
        mesh.material = converted.length === 1 ? converted[0] : converted;
        meshes.push(mesh);
      });

      modelStates.push({ key: definition.key, wrapper, materials, meshes });
    };

    const fitDigitalTwin = () => {
      const skin = modelStates.find((model) => model.key === 'SKIN');
      const fitObject = skin?.wrapper || digitalTwinGroup;
      const fitBox = new THREE.Box3().setFromObject(fitObject);
      if (fitBox.isEmpty()) return;

      const fitSize = fitBox.getSize(new THREE.Vector3());
      const fitCenter = fitBox.getCenter(new THREE.Vector3());
      const scale = fitSize.y > 0 ? 2.08 / fitSize.y : 1;
      digitalTwinGroup.scale.setScalar(scale);
      digitalTwinGroup.position.set(-fitCenter.x * scale, -fitBox.min.y * scale, -fitCenter.z * scale);
      digitalTwinGroup.updateMatrixWorld(true);

      controls.target.set(0, 1.04, 0);
      controls.update();
      const heatPosition = new THREE.Vector3(0, 0.46, 0.14).applyMatrix4(digitalTwinGroup.matrixWorld);
      heatLight.position.copy(heatPosition);
    };

    // Computes the five callout anchor points once, right after the digital
    // twin has been scaled/centered. Anchors are stored in digitalTwinGroup's
    // LOCAL space so the (cheap) per-frame update only needs to re-apply the
    // group's current matrixWorld — no bounding-box recomputation, no layout
    // thrash, safe to run every animation frame.
    const computeCalloutAnchors = () => {
      const heartModel = modelStates.find((model) => model.key === 'HEART');
      const lungsModel = modelStates.find((model) => model.key === 'LUNGS');
      const liverModel = modelStates.find((model) => model.key === 'LIVER');
      const vesselsModel = modelStates.find((model) => model.key === 'VESSELS');
      const skinModel = modelStates.find((model) => model.key === 'SKIN');

      const toLocal = (worldPoint: THREE.Vector3 | null): THREE.Vector3 | null =>
        worldPoint ? digitalTwinGroup.worldToLocal(worldPoint.clone()) : null;

      const heartWorld = getModelAnchor(heartModel);
      const lungsWorld = getModelAnchor(lungsModel);
      const liverWorld = getModelAnchor(liverModel);
      const vesselsWorld = getModelAnchor(vesselsModel);

      // TEMP is not an organ — it's a torso/core reference point derived
      // from the SKIN model's own bounding box (roughly chest/upper-abdomen
      // height, on the body's centerline).
      let tempWorld: THREE.Vector3 | null = null;
      if (skinModel) {
        const skinBox = new THREE.Box3().setFromObject(skinModel.wrapper);
        if (!skinBox.isEmpty()) {
          const skinCenter = skinBox.getCenter(new THREE.Vector3());
          tempWorld = new THREE.Vector3(
            skinCenter.x,
            skinBox.min.y + (skinBox.max.y - skinBox.min.y) * 0.6,
            skinCenter.z
          );
        }
      }

      anchorLocalRef.current = {
        HEART: toLocal(heartWorld),
        LUNGS: toLocal(lungsWorld),
        LIVER: toLocal(liverWorld),
        VESSELS: toLocal(vesselsWorld),
        TEMP: toLocal(tempWorld)
      };
    };

    const loadAllModels = async () => {
      await Promise.all(
        MODEL_DEFINITIONS.map(async (definition) => {
          try {
            const gltf = await loadModel(loader, definition, (event) => {
              if (event.total > 0 && !disposed) {
                const fractional = Math.min(event.loaded / event.total, 0.98);
                setLoadProgress((current) =>
                  Math.max(current, Math.round(((completedModels + fractional) / MODEL_DEFINITIONS.length) * 100))
                );
              }
            });
            if (disposed) {
              disposeObject(gltf.scene, textureSet);
              return;
            }
            registerModel(definition, gltf);
          } catch {
            if (!disposed) setMissingParts((current) => [...current, definition.key]);
          } finally {
            completedModels += 1;
            if (!disposed) {
              setLoadProgress(Math.round((completedModels / MODEL_DEFINITIONS.length) * 100));
            }
          }
        })
      );

      if (disposed) return;
      fitDigitalTwin();
      computeCalloutAnchors();
      setIsLoading(false);
    };

    void loadAllModels();

    let pointerStart = { x: 0, y: 0 };
    let pointerMoved = 0;
    let pointerStartedAt = 0;
    let isDragging = false;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const handlePointerDown = (event: PointerEvent) => {
      pointerStart = { x: event.clientX, y: event.clientY };
      pointerMoved = 0;
      pointerStartedAt = performance.now();
      isDragging = true;
      renderer.domElement.setPointerCapture?.(event.pointerId);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!isDragging) return;
      const dx = event.clientX - pointerStart.x;
      const dy = event.clientY - pointerStart.y;
      pointerMoved += Math.sqrt(dx * dx + dy * dy);
      pointerStart = { x: event.clientX, y: event.clientY };
      digitalTwinGroup.rotation.y += dx * 0.009;
      digitalTwinGroup.rotation.x = THREE.MathUtils.clamp(digitalTwinGroup.rotation.x + dy * 0.0025, -0.08, 0.08);
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (!isDragging) return;
      isDragging = false;
      renderer.domElement.releasePointerCapture?.(event.pointerId);
      if (pointerMoved > 7 || performance.now() - pointerStartedAt > 550) return;

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      const intersections = raycaster.intersectObjects(digitalTwinGroup.children, true);
      const selectedHit = intersections.find((intersection) => {
        const key = intersection.object.userData.modelKey as ModelKey | undefined;
        return key && key !== 'SKIN';
      });
      const hitKey = selectedHit?.object.userData.modelKey as ModelKey | undefined;
      if (hitKey && hitKey !== 'SKIN') {
        setSelectedOrgan(hitKey);
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('pointerup', handlePointerUp);
    renderer.domElement.addEventListener('pointercancel', handlePointerUp);

    const clock = new THREE.Clock();
    let lastHudUpdate = 0;

    // Imperatively projects every callout anchor to screen space and writes
    // the result straight to the SVG/DOM nodes. No setState here — this runs
    // every animation frame (auto-rotate, manual drag, zoom, resize all flow
    // through it) so triggering a React re-render per frame would be wasteful.
    const updateCallouts = (statuses: ReturnType<typeof statusForVitals>) => {
      // Cheap front/back-of-body test, computed ONCE per frame (not per
      // anchor, and not a triangle-level raycast — that was expensive enough
      // against the full-resolution skin mesh to stall the render loop and
      // make the whole twin look frozen). Anchors and the camera are both
      // expressed in digitalTwinGroup's local space; since the body only
      // rotates about its vertical (Y) axis, comparing each anchor's XZ
      // direction from the body's centerline to the camera's XZ direction
      // tells us, cheaply, whether that anchor currently faces the camera
      // or is around the back.
      const localCamera = digitalTwinGroup.worldToLocal(camera.position.clone());
      const camXZLen = Math.sqrt(localCamera.x * localCamera.x + localCamera.z * localCamera.z) || 1;

      CALLOUT_KEYS.forEach((key) => {
        const refs = calloutElRefs.current[key];
        const local = anchorLocalRef.current[key];

        if (!local || !refs.label || !refs.line || !refs.circle) {
          if (refs.label) refs.label.style.opacity = '0';
          if (refs.line) refs.line.setAttribute('opacity', '0');
          if (refs.circle) refs.circle.setAttribute('opacity', '0');
          return;
        }

        const world = local.clone().applyMatrix4(digitalTwinGroup.matrixWorld);
        const ndc = world.clone().project(camera);

        // Behind the camera entirely — hide rather than draw a stray line.
        if (ndc.z > 1 || ndc.z < -1) {
          refs.label.style.opacity = '0';
          refs.line.setAttribute('opacity', '0');
          refs.circle.setAttribute('opacity', '0');
          return;
        }

        const targetX = (ndc.x * 0.5 + 0.5) * width;
        const targetY = (-ndc.y * 0.5 + 0.5) * height;

        // Occlusion approximation: does this anchor's outward direction from
        // the body's centerline still roughly face the camera?
        const anchorXZLen = Math.sqrt(local.x * local.x + local.z * local.z);
        let occluded = false;
        if (anchorXZLen > 0.0001) {
          const facing = (local.x * localCamera.x + local.z * localCamera.z) / (anchorXZLen * camXZLen);
          occluded = facing < 0.1;
        }

        // Push the label out from its OWN anchor along this organ's fixed
        // fan-out direction (see LABEL_DIRECTIONS) rather than radially from
        // the canvas center — anchors this close together on the torso
        // midline would otherwise all get pushed the same way and collide.
        // The label position is still recomputed from the live anchor every
        // frame, so it keeps following the anatomy through rotation; only
        // the *bias direction* is constant.
        const dir = LABEL_DIRECTIONS[key];
        const dirLength = Math.sqrt(dir.x * dir.x + dir.y * dir.y) || 1;
        const nx = dir.x / dirLength;
        const ny = dir.y / dirLength;
        const labelOffset = Math.max(56, Math.min(112, Math.min(width, height) * 0.3));
        const margin = Math.max(44, Math.min(78, width * 0.22));
        const labelX = Math.min(Math.max(targetX + nx * labelOffset, margin), Math.max(width - margin, margin));
        const labelY = Math.min(Math.max(targetY + ny * labelOffset, margin), Math.max(height - margin, margin));

        const color = calloutColor(key, statuses);
        const baseOpacity = occluded ? 0.32 : 1;

        refs.label.style.transform = `translate(${labelX}px, ${labelY}px) translate(-50%, -50%)`;
        refs.label.style.opacity = String(baseOpacity);

        refs.line.setAttribute('x1', labelX.toFixed(1));
        refs.line.setAttribute('y1', labelY.toFixed(1));
        refs.line.setAttribute('x2', targetX.toFixed(1));
        refs.line.setAttribute('y2', targetY.toFixed(1));
        refs.line.setAttribute('stroke', color);
        refs.line.setAttribute('opacity', String(occluded ? 0.22 : 0.85));

        refs.circle.setAttribute('cx', targetX.toFixed(1));
        refs.circle.setAttribute('cy', targetY.toFixed(1));
        refs.circle.setAttribute('fill', color);
        refs.circle.setAttribute('opacity', String(baseOpacity));
      });
    };

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const liveVitals = vitalsRef.current;
      const liveSelectedOrgan = selectedOrganRef.current;
      const liveView = anatomyViewRef.current;
      const statuses = statusForVitals(liveVitals);

      if (autoRotateRef.current && !isDragging) {
        digitalTwinGroup.rotation.y += 0.0024;
      }

      const opacityFor = (key: ModelKey) => {
        if (key === 'SKIN') {
          if (liveView === 'SKIN') return 0.96;
          if (liveView === 'INTERNAL') return 0.07;
          return 0.21;
        }
        if (liveView === 'SKIN') return key === liveSelectedOrgan ? 0.12 : 0.035;
        if (liveView === 'INTERNAL') return 0.98;
        return key === liveSelectedOrgan ? 0.93 : 0.84;
      };

      modelStates.forEach((model) => {
        const selected = model.key === liveSelectedOrgan;
        const opacity = opacityFor(model.key);
        model.wrapper.visible = true;

        model.materials.forEach((state) => {
          const material = state.material;
          material.opacity = opacity;
          material.visible = opacity > 0.012;
          material.depthWrite = model.key !== 'SKIN' && opacity > 0.72;
          material.depthTest = model.key !== 'SKIN';

          let emissiveColor = 0x000000;
          let emissiveIntensity = 0;
          if (model.key === 'HEART') {
            emissiveColor = statusColor(statuses.heart, 0xc6284c);
            emissiveIntensity = selected ? 0.68 : statuses.heart === 'NORMAL' ? 0.035 : 0.25;
          } else if (model.key === 'LUNGS') {
            emissiveColor = statusColor(statuses.lungs, 0x228fa7);
            emissiveIntensity = selected ? 0.5 : statuses.lungs === 'NORMAL' ? 0.025 : 0.24;
          } else if (model.key === 'LIVER') {
            emissiveColor = selected ? 0xc46b32 : 0x000000;
            emissiveIntensity = selected ? 0.27 : 0;
          } else if (model.key === 'VESSELS') {
            emissiveColor =
              statuses.vessels === 'CRITICAL'
                ? 0xf43f5e
                : statuses.vessels === 'WARNING'
                  ? 0xf59e0b
                  : state.vesselKind === 'VEIN'
                    ? 0x2077a1
                    : 0x9f3348;
            emissiveIntensity = selected ? 0.42 : statuses.vessels === 'NORMAL' ? 0.045 : 0.22;
          }

          material.emissive.set(emissiveColor);
          material.emissiveIntensity = emissiveIntensity;
        });
      });

      const heart = modelStates.find((model) => model.key === 'HEART');
      const lungs = modelStates.find((model) => model.key === 'LUNGS');
      if (heart) {
        const pulseSpeed = Math.max(1.3, (liveVitals.heartRate / 60) * 3.4);
        const pulseAmplitude = statuses.heart === 'CRITICAL' ? 0.072 : 0.042;
        heart.wrapper.scale.setScalar(1 + Math.sin(elapsed * pulseSpeed) * pulseAmplitude);
      }
      if (lungs) {
        const breathSpeed = Math.max(0.9, (liveVitals.respiratoryRate / 12) * 1.65);
        const breath = 1 + Math.sin(elapsed * breathSpeed) * 0.035;
        lungs.wrapper.scale.set(1 + (breath - 1) * 1.15, breath, 1 + (breath - 1) * 0.75);
      }

      const tempIntensity =
        statuses.temperature === 'CRITICAL' ? 1.6 : statuses.temperature === 'WARNING' ? 0.72 : liveSelectedOrgan === 'TEMP' ? 0.26 : 0;
      heatLight.intensity = THREE.MathUtils.lerp(heatLight.intensity, tempIntensity, 0.06);
      heatLight.color.set(liveVitals.temperature >= 37.5 ? 0xf97316 : 0x38bdf8);
      controls.update();

      if (elapsed - lastHudUpdate > 0.15) {
        lastHudUpdate = elapsed;
        const degrees = Math.round((((digitalTwinGroup.rotation.y * 180) / Math.PI) % 360 + 360) % 360);
        setRotationAngle(degrees);
      }

      // digitalTwinGroup.matrixWorld must reflect this frame's rotation
      // before we project anchors — updateMatrixWorld is cheap for a single
      // group + its already-updated children transforms.
      digitalTwinGroup.updateMatrixWorld(true);
      updateCallouts(statuses);

      renderer.render(scene, camera);
    };
    animate();

    const resizeObserver = new ResizeObserver(() => {
      width = container.clientWidth;
      height = container.clientHeight;
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });
    resizeObserver.observe(container);

    return () => {
      disposed = true;
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('pointerup', handlePointerUp);
      renderer.domElement.removeEventListener('pointercancel', handlePointerUp);
      controls.dispose();

      const disposedRoots = new Set<THREE.Object3D>();
      modelStates.forEach((model) => {
        if (!disposedRoots.has(model.wrapper)) {
          disposedRoots.add(model.wrapper);
          disposeObject(model.wrapper, textureSet);
        }
      });
      textureSet.forEach((texture) => texture.dispose());
      gridHelper.geometry.dispose();
      gridMaterials.forEach((material) => material.dispose());
      pmremGenerator.dispose();
      renderer.dispose();

      anchorLocalRef.current = { HEART: null, LUNGS: null, LIVER: null, VESSELS: null, TEMP: null };

      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  const selectOrgan = useCallback((organ: OrganKey) => {
    setSelectedOrgan(organ);
  }, []);

  const handleSimulateCritical = useCallback(
    (type: 'TACHYCARDIA' | 'DESATURATION' | 'NORMAL') => {
      if (!onVitalsChange) return;
      setIsSimulating(true);

      if (type === 'TACHYCARDIA') {
        onVitalsChange({ heartRate: 145, systolic: 178, diastolic: 98 });
        setSelectedOrgan('HEART');
      } else if (type === 'DESATURATION') {
        onVitalsChange({ spo2: 81, respiratoryRate: 28 });
        setSelectedOrgan('LUNGS');
      } else {
        onVitalsChange({
          heartRate: 72,
          spo2: 98,
          systolic: 120,
          diastolic: 80,
          temperature: 36.8,
          respiratoryRate: 16
        });
        setSelectedOrgan('HEART');
      }

      window.setTimeout(() => setIsSimulating(false), 500);
    },
    [onVitalsChange]
  );

  const statusLabel = patientStatus || 'Monitoring';
  const selectedLabel =
    selectedOrgan === 'HEART'
      ? 'Heart'
      : selectedOrgan === 'LUNGS'
        ? 'Lungs'
        : selectedOrgan === 'LIVER'
          ? 'Liver'
          : selectedOrgan === 'VESSELS'
            ? 'Vessels'
            : 'Core temperature';

  return (
    <div className="relative w-full h-[660px] rounded-3xl bg-slate-950/95 border border-cyan-500/30 shadow-2xl overflow-hidden backdrop-blur-2xl flex flex-col justify-between p-6 text-white">
      <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" /> 3D Anatomical Digital Twin
            </span>
            <span className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Live Telemetry Synced
            </span>
          </div>
          <h2 className="text-xl font-black tracking-tight text-white mt-1">SHREEDHA ICU Digital Twin</h2>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">
            Live Patient Anatomy &amp; Vital Monitoring <span className="text-cyan-400">— {patientName}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <div className="flex items-center rounded-xl border border-slate-700 bg-slate-900 p-0.5 gap-0.5">
            {(['DIGITAL_TWIN', 'SKIN', 'INTERNAL'] as AnatomyView[]).map((view) => (
              <button
                key={view}
                onClick={() => setAnatomyView(view)}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                  anatomyView === view ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3 h-3" />
                {view === 'DIGITAL_TWIN' ? 'Digital Twin' : view === 'SKIN' ? 'Skin' : 'Internal Anatomy'}
              </button>
            ))}
          </div>

          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2.5 py-1 rounded-lg border border-cyan-800 flex items-center gap-1">
            <RotateCcw className="w-3 h-3 text-cyan-400" /> Angle: {rotationAngle}°
          </span>
          <button
            onClick={() => setAutoRotate((current) => !current)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
              autoRotate ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            {autoRotate ? '360° Rotate ON' : 'Rotate Paused'}
          </button>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center flex-1 py-2">
        <div className="lg:col-span-7 relative h-[520px] flex items-center justify-center">
          <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing rounded-2xl overflow-hidden" />

          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/70 backdrop-blur-sm rounded-2xl pointer-events-none">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              <p className="text-sm font-bold text-cyan-200">Loading Digital Twin...</p>
              <div className="w-40 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-cyan-400 rounded-full transition-all" style={{ width: `${loadProgress}%` }} />
              </div>
              <span className="text-[10px] text-slate-500">{loadProgress}% of anatomy loaded</span>
            </div>
          )}

          {!isLoading && missingParts.length > 0 && (
            <div className="absolute top-3 left-3 px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-[10px] font-bold text-amber-300 max-w-[235px]">
              {missingParts.includes('SKIN') ? 'Skin model unavailable' : 'Some anatomical data unavailable'}
            </div>
          )}

          {/*
            3D-anchored callout system.
            The SVG overlay draws the leader line + endpoint dot for each of
            the five organ/region anchors; the labels below are plain,
            clickable buttons. Every coordinate here starts at (0,0) / hidden
            — actual placement is written directly to these DOM nodes every
            animation frame (see `updateCallouts` in the effect above), never
            via Tailwind percentage classes and never via setState.
          */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
            {CALLOUT_KEYS.map((key) => (
              <line
                key={`callout-line-${key}`}
                ref={(el) => {
                  calloutElRefs.current[key].line = el;
                }}
                x1={0}
                y1={0}
                x2={0}
                y2={0}
                stroke="#22d3ee"
                strokeWidth={1.4}
                strokeLinecap="round"
                opacity={0}
              />
            ))}
            {CALLOUT_KEYS.map((key) => (
              <circle
                key={`callout-dot-${key}`}
                ref={(el) => {
                  calloutElRefs.current[key].circle = el;
                }}
                cx={0}
                cy={0}
                r={4}
                fill="#22d3ee"
                opacity={0}
              >
                <title>{key}</title>
              </circle>
            ))}
          </svg>

          <div className="absolute inset-0 pointer-events-none">
            {/*
              Label CONTENT ONLY changed below to show a clinical
              observation format: a small uppercase parameter name plus a
              visually prominent live value, sourced strictly from the
              existing `vitals` prop. Positioning, refs, anchors, leader
              lines, click handlers, colors and container classes are
              untouched.
            */}
            <button
              ref={(el) => {
                calloutElRefs.current.LUNGS.label = el;
              }}
              onClick={() => selectOrgan('LUNGS')}
              className={`pointer-events-auto absolute left-0 top-0 opacity-0 flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold shadow-2xl backdrop-blur-md transition-colors hover:brightness-110 ${
                selectedOrgan === 'LUNGS'
                  ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200 ring-2 ring-cyan-500/50'
                  : vitalStatus.lungs === 'CRITICAL'
                    ? 'bg-rose-950/90 border-rose-500 text-rose-200'
                    : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Wind className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="flex flex-col leading-tight text-left">
                <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">
                  Oxygen Saturation (SpO2 %)
                </span>
                <span className="text-sm font-black">{vitals.spo2}</span>
              </span>
            </button>

            <button
              ref={(el) => {
                calloutElRefs.current.HEART.label = el;
              }}
              onClick={() => selectOrgan('HEART')}
              className={`pointer-events-auto absolute left-0 top-0 opacity-0 flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold shadow-2xl backdrop-blur-md transition-colors hover:brightness-110 ${
                selectedOrgan === 'HEART'
                  ? 'bg-rose-950/90 border-rose-400 text-rose-200 ring-2 ring-rose-500/50'
                  : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Heart className="w-4 h-4 text-rose-500 animate-pulse shrink-0" />
              <span className="flex flex-col leading-tight text-left">
                <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">
                  Heart Rate (BPM)
                </span>
                <span className="text-sm font-black">{vitals.heartRate}</span>
              </span>
            </button>

            <button
              ref={(el) => {
                calloutElRefs.current.LIVER.label = el;
              }}
              onClick={() => selectOrgan('LIVER')}
              className={`pointer-events-auto absolute left-0 top-0 opacity-0 flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold shadow-2xl backdrop-blur-md transition-colors hover:brightness-110 ${
                selectedOrgan === 'LIVER'
                  ? 'bg-orange-950/90 border-orange-400 text-orange-200 ring-2 ring-orange-500/50'
                  : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Activity className="w-4 h-4 text-orange-400 shrink-0" />
              <span className="flex flex-col leading-tight text-left">
                <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">
                  Resp Rate (/min)
                </span>
                <span className="text-sm font-black">{vitals.respiratoryRate}</span>
              </span>
            </button>

            <button
              ref={(el) => {
                calloutElRefs.current.VESSELS.label = el;
              }}
              onClick={() => selectOrgan('VESSELS')}
              className={`pointer-events-auto absolute left-0 top-0 opacity-0 flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold shadow-2xl backdrop-blur-md transition-colors hover:brightness-110 ${
                selectedOrgan === 'VESSELS'
                  ? 'bg-blue-950/90 border-blue-400 text-blue-200 ring-2 ring-blue-500/50'
                  : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Activity className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="flex flex-col leading-tight text-left">
                <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">
                  Systolic / Diastolic BP (mmHg)
                </span>
                <span className="text-sm font-black">
                  {vitals.systolic} / {vitals.diastolic}
                </span>
              </span>
            </button>

            <button
              ref={(el) => {
                calloutElRefs.current.TEMP.label = el;
              }}
              onClick={() => selectOrgan('TEMP')}
              className={`pointer-events-auto absolute left-0 top-0 opacity-0 flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold shadow-2xl backdrop-blur-md transition-colors hover:brightness-110 ${
                selectedOrgan === 'TEMP'
                  ? 'bg-amber-950/90 border-amber-400 text-amber-200 ring-2 ring-amber-500/50'
                  : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Thermometer className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="flex flex-col leading-tight text-left">
                <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">
                  Body Temp (°C)
                </span>
                <span className="text-sm font-black">{vitals.temperature}</span>
              </span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 bg-slate-900/95 border border-cyan-500/30 rounded-2xl p-5 shadow-2xl backdrop-blur-xl space-y-4">
          <AnimatePresence mode="wait">
            {selectedOrgan === 'HEART' && (
              <TelemetryPanel
                key="heart"
                patientName={patientName}
                title="Coronary & Cardiac Telemetry"
                icon={<Heart className="w-5 h-5 animate-pulse" />}
                iconClass="bg-rose-500/20 text-rose-400 border-rose-500/30"
                status={vitalStatus.heart}
                statusClass={vitalStatus.heart === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'}
              >
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Live Heart Rate</span>
                    <div className="text-3xl font-black text-white mt-0.5">
                      {vitals.heartRate} <span className="text-sm font-bold text-slate-400">bpm</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Target Clinical Range</span>
                    <p className="text-xs font-bold text-cyan-400 mt-1">60 - 100 bpm</p>
                  </div>
                </div>
                <Assessment>
                  {vitals.heartRate > 120
                    ? `🚨 ACUTE TACHYCARDIA ALERT: ${patientName}'s cardiac output is elevated (${vitals.heartRate} bpm). Telemetry waveform requires immediate physician evaluation.`
                    : vitals.heartRate < 60
                      ? `⚠️ BRADYCARDIA DETECTED: Heart rate is ${vitals.heartRate} bpm. Monitor cardiac perfusion.`
                      : '✅ Normal Sinus Rhythm observed. Myocardial oxygenation and pulse rate stable.'}
                </Assessment>
              </TelemetryPanel>
            )}

            {selectedOrgan === 'LUNGS' && (
              <TelemetryPanel
                key="lungs"
                patientName={patientName}
                title="Pulmonary Oxygenation"
                icon={<Wind className="w-5 h-5" />}
                iconClass="bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
                status={vitalStatus.lungs}
                statusClass={vitalStatus.lungs === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'}
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">SpO₂ Oxygen</span>
                    <div className="text-2xl font-black text-white mt-0.5">{vitals.spo2}%</div>
                    <span className="text-[10px] text-slate-400">Target ≥ 95%</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Respiratory Rate</span>
                    <div className="text-2xl font-black text-white mt-0.5">
                      {vitals.respiratoryRate} <span className="text-xs text-slate-400">/min</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Target 12 - 20 /min</span>
                  </div>
                </div>
                <Assessment>
                  {vitals.spo2 <= 90
                    ? `🚨 ACUTE HYPOXEMIA ALERT: ${patientName}'s oxygen saturation desaturated to ${vitals.spo2}%. High flow oxygen therapy indicated immediately.`
                    : '✅ Alveolar gas exchange and pulmonary oxygen saturation operating within normal clinical boundaries.'}
                </Assessment>
              </TelemetryPanel>
            )}

            {selectedOrgan === 'LIVER' && (
              <TelemetryPanel
                key="liver"
                patientName={patientName}
                title="Hepatic Anatomy"
                icon={<Activity className="w-5 h-5" />}
                iconClass="bg-orange-500/20 text-orange-400 border-orange-500/30"
                status="MODEL READY"
                statusClass="bg-orange-500/20 text-orange-300 border-orange-500/40"
              >
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Selected structure</span>
                  <div className="text-xl font-black text-white mt-1">Liver model</div>
                  <p className="text-[10px] text-slate-500 mt-2">HuBMAP reference anatomy • aligned below the lungs</p>
                </div>
                <Assessment>The liver is rendered from the loaded anatomical reference model. No liver-specific vital is available in the current patient telemetry.</Assessment>
              </TelemetryPanel>
            )}

            {selectedOrgan === 'VESSELS' && (
              <TelemetryPanel
                key="vessels"
                patientName={patientName}
                title="Systemic Arterial Pressure"
                icon={<Activity className="w-5 h-5" />}
                iconClass="bg-blue-500/20 text-blue-400 border-blue-500/30"
                status={vitalStatus.vessels}
                statusClass={vitalStatus.vessels === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-blue-500/20 text-blue-300 border-blue-500/40'}
              >
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Systolic / Diastolic</span>
                    <div className="text-3xl font-black text-white mt-0.5">
                      {vitals.systolic}/{vitals.diastolic} <span className="text-sm font-bold text-slate-400">mmHg</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Calculated MAP</span>
                    <p className="text-lg font-black text-cyan-400 mt-0.5">
                      {Math.round((vitals.systolic + 2 * vitals.diastolic) / 3)} <span className="text-xs text-slate-400">mmHg</span>
                    </p>
                  </div>
                </div>
                <Assessment>
                  {vitals.systolic >= 160
                    ? `⚠️ HYPERTENSIVE CRISIS: ${patientName}'s blood pressure is ${vitals.systolic}/${vitals.diastolic} mmHg.`
                    : '✅ Hemodynamic perfusion and systemic vascular resistance normal.'}
                </Assessment>
              </TelemetryPanel>
            )}

            {selectedOrgan === 'TEMP' && (
              <TelemetryPanel
                key="temp"
                patientName={patientName}
                title="Thermoregulation"
                icon={<Thermometer className="w-5 h-5" />}
                iconClass="bg-amber-500/20 text-amber-400 border-amber-500/30"
                status={vitalStatus.temperature}
                statusClass={vitalStatus.temperature === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'}
              >
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Core Temperature</span>
                    <div className="text-3xl font-black text-white mt-0.5">
                      {vitals.temperature} <span className="text-sm font-bold text-slate-400">°C</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Target Range</span>
                    <p className="text-xs font-bold text-cyan-400 mt-1">36.5 - 37.5 °C</p>
                  </div>
                </div>
                <Assessment>
                  {vitals.temperature >= 38.5
                    ? `⚠️ HYPERTHERMIA: ${patientName}'s core temperature is ${vitals.temperature}°C.`
                    : '✅ Body core temperature within normo-thermic boundaries.'}
                </Assessment>
              </TelemetryPanel>
            )}
          </AnimatePresence>

          <div className="text-[10px] text-slate-500 flex items-center justify-between border-t border-slate-800 pt-3">
            <span>Selected: <strong className="text-slate-300">{selectedLabel}</strong></span>
            <span>{statusLabel}</span>
          </div>

          {onVitalsChange && (
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-2 flex items-center gap-1">
                <Zap className="w-3 h-3 text-cyan-400" /> Interactive Live Telemetry Simulator:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleSimulateCritical('DESATURATION')}
                  disabled={isSimulating}
                  className="px-2 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-[10px] font-bold transition-all text-center disabled:opacity-50"
                >
                  Test Desat (81%)
                </button>
                <button
                  onClick={() => handleSimulateCritical('TACHYCARDIA')}
                  disabled={isSimulating}
                  className="px-2 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[10px] font-bold transition-all text-center disabled:opacity-50"
                >
                  Test HR (145 bpm)
                </button>
                <button
                  onClick={() => handleSimulateCritical('NORMAL')}
                  disabled={isSimulating}
                  className="px-2 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold transition-all text-center disabled:opacity-50"
                >
                  Reset Normal
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface TelemetryPanelProps {
  patientName: string;
  title: string;
  icon: React.ReactNode;
  iconClass: string;
  status: string;
  statusClass: string;
  children: React.ReactNode;
}

const TelemetryPanel: React.FC<TelemetryPanelProps> = ({ patientName, title, icon, iconClass, status, statusClass, children }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-4"
  >
    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
      <div className="flex items-center gap-2">
        <div className={`p-2 rounded-xl border ${iconClass}`}>{icon}</div>
        <div>
          <h3 className="text-base font-extrabold text-white">{title}</h3>
          <p className="text-[10px] text-slate-400">Patient: {patientName}</p>
        </div>
      </div>
      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${statusClass}`}>{status}</span>
    </div>
    {children}
  </motion.div>
);

const Assessment: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="space-y-2">
    <span className="text-[10px] font-extrabold uppercase text-slate-400">Clinical assessment</span>
    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-slate-800/60">{children}</p>
  </div>
);

export default Body3DVisualization;
