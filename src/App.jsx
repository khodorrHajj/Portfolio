import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Center, Html, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";

const MODEL_PATH = "/models/desk_pc_room.optimized.glb";
const MOBILE_SCREEN_UI_DELAY_MS = 1200;
const ROOM_TRANSITION_MS = 900;
const ROOM_CAMERA_POSITION = [0, 1.0, 5.2];
const ROOM_TARGET = [0, 0, 0];
const INTRO_CAMERA_POSITION = [0, 1.0, 10.5];
const INTRO_TARGET = [0, 1.05, 7.2];
const INTRO_POPUP_POSITION = [0, 1.05, 7.2];
const MOBILE_BREAKPOINT = 768;
const DESKTOP_FOLDERS = [
  "About Me",
  "Projects",
  "Skills",
  "Contact",
];

const FOLDER_CONTENT = {
  "About Me": [
    {
      heading: "Who I Am",
      body: (
        <>
          Hey i am Khodor El Hajj Moussa, a <strong>CS student</strong> that is
          near graduation at Antonine University, and passionate about coding,
          building stuff and exploring paths.
        </>
      ),
    },
    {
      heading: "What I Like Building",
      body: "I worked on multiple projects, which some of them were dedicated as University Projects and others that were self taught and made, i only look to the opportunity to learn more and build a good portfolio for myself.",
    },
    {
      heading: "Cuurent Goal",
      body: "Improving my skills, and working with production level projects is what i am looking to learn and improve, and growing more as a developer. Also i am looking forward to continue as a Software Engineer in the future.",
    },
  ],
  Projects: [
    {
      heading: "ASL-ML",
      body: "A computer vision and machine learning-based real-time American Sign Language translator that translates hand gestures into text. It enables static alphabet gestures, dynamic word gestures, prediction correction, and AI-based word recommendations, via a React and FastAPI user interface.",
      link: "https://github.com/khodorrHajj/ASL-Real-Time-Sign-Language-Translator",
    },
    {
      heading: "Repo Analyzer",
      body: "A command-line interface to analyze GitHub repositories and produce reports for decision making. It assesses activity, documentation, engineering practices, contributor risks, ownership, and recruiter signals to provide a quick overview of a repository's quality and risks.",
      link: "https://github.com/khodorrHajj/GithubRepoAnalyzer",
    },
    {
      heading: "Compiler Workbench",
      body: "A desktop Qt application to learn and experiment with compiler techniques. It offers a tool to design automata, perform lexical analysis, parsing, semantic analysis, display the AST (Abstract Syntax Tree) and generate some code.",
      link: "https://github.com/khodorrHajj/CompilerDesign",
    },
    {
      heading: "Finance Tracker",
      body: "A financial tracker for Lebanese citizens to monitor their wallet, expenses and currency rates. It features receipt scanning using OCR, real-time LBP-to-USD conversion, Google OAuth authentication, email TOTP, Password Recovery, Autheticator 2FA, and a set of tools to enable users to track their expenses in a multi-currency world.",
      link: "#",
      linkLabel: "Still in development",
    },
  ],
  Skills: [
    {
      heading: "Frontend",
      body: "React, JavaScript, HTML, CSS, and building responsive interfaces for projects and learning purposes.",
    },
    {
      heading: "Backend",
      body: "FastAPI, backend fundamentals, working with APIs, and connecting backend logic with frontend applications.",
    },
    {
      heading: "Programming Languages",
      body: "Python, JavaScript, C++, and Java through university work and personal projects.",
    },
    {
      heading: "Tools",
      body: "Git, GitHub, command line usage, Qt basics, OCR integrations, and experimenting with machine learning projects.",
    },
    {
      heading: "What I Am Improving",
      body: "Project structure, problem solving, writing cleaner code, and improving my full-stack development skills through practice.",
    },
  ],
  Experience: [
    {
      heading: "School Coding Tutor",
      body: "School Coding Tutor with an experience of over 2 years, where i worked with Jtech Academy And Istay, and i tutored at multiple schools including Val Per Jacques, SSCC Hadath, Notre Dame De Jamhour",
    },
  ],
  Contact: [
    {
      heading: "Email",
      body: "khodorhajjmoussa@gmail.com",
    },
    {
      heading: "Phone",
      body: "+96170626913",
    },
    {
      heading: "Location",
      body: "Betchay Lebanon",
    },
  ],
};

function getProjectedMeshRect(mesh, camera, viewportSize) {
  const geometry = mesh.geometry;
  if (!geometry) return null;

  if (!geometry.boundingBox) {
    geometry.computeBoundingBox();
  }

  const { min, max } = geometry.boundingBox;
  const corners = [
    new THREE.Vector3(min.x, min.y, min.z),
    new THREE.Vector3(min.x, min.y, max.z),
    new THREE.Vector3(min.x, max.y, min.z),
    new THREE.Vector3(min.x, max.y, max.z),
    new THREE.Vector3(max.x, min.y, min.z),
    new THREE.Vector3(max.x, min.y, max.z),
    new THREE.Vector3(max.x, max.y, min.z),
    new THREE.Vector3(max.x, max.y, max.z),
  ];

  let left = Number.POSITIVE_INFINITY;
  let top = Number.POSITIVE_INFINITY;
  let right = Number.NEGATIVE_INFINITY;
  let bottom = Number.NEGATIVE_INFINITY;

  for (const corner of corners) {
    corner.applyMatrix4(mesh.matrixWorld).project(camera);

    const x = (corner.x * 0.5 + 0.5) * viewportSize.width;
    const y = (-corner.y * 0.5 + 0.5) * viewportSize.height;

    left = Math.min(left, x);
    top = Math.min(top, y);
    right = Math.max(right, x);
    bottom = Math.max(bottom, y);
  }

  return {
    left,
    top,
    width: right - left,
    height: bottom - top,
  };
}

function makeInvisibleButClickable(material) {
  if (!material) return;

  material.transparent = true;
  material.opacity = 0;
  material.depthWrite = false;
  material.needsUpdate = true;
}

function Model({
  isScreenFocused,
  onScreenClick,
  onScreenReady,
  onScreenRectChange,
}) {
  const { scene } = useGLTF(MODEL_PATH);
  const { camera, size } = useThree();
  const model = useMemo(() => scene.clone(true), [scene]);
  const modelGroupRef = useRef(null);
  const screenMaterialRef = useRef(null);
  const screenHitboxRef = useRef(null);
  const lastScreenRectRef = useRef(null);

  useEffect(() => {
    model.traverse((child) => {
      if (child.name !== "Screen_Hitbox") return;

      const overlayMaterial = new THREE.MeshBasicMaterial({
        color: "#8f949c",
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide,
      });

      child.material = overlayMaterial;
      screenMaterialRef.current = overlayMaterial;
      screenHitboxRef.current = child;
    });

    return () => {
      screenMaterialRef.current?.dispose();
    };
  }, [model]);

  useEffect(() => {
    const screenMaterial = screenMaterialRef.current;
    if (!screenMaterial) return;

    screenMaterial.opacity = isScreenFocused ? 1 : 0;
    screenMaterial.color.set("#8f949c");
    screenMaterial.transparent = true;
    screenMaterial.depthWrite = false;
    screenMaterial.side = THREE.DoubleSide;
    screenMaterial.needsUpdate = true;
  }, [isScreenFocused]);

  useEffect(() => {
    const group = modelGroupRef.current;
    if (!group) return;

    let screenHitbox = null;
    group.traverse((child) => {
      if (child.name === "Screen_Hitbox") {
        screenHitbox = child;
      }
    });

    if (!screenHitbox) {
      console.warn("Screen_Hitbox was not found in the GLB.");
      return;
    }

    group.updateWorldMatrix(true, true);

    const screenBounds = new THREE.Box3().setFromObject(screenHitbox);
    const screenCenter = screenBounds.getCenter(new THREE.Vector3());

    onScreenReady({
      position: screenCenter.toArray(),
    });
  }, [model, onScreenReady]);

  useFrame(() => {
    if (!isScreenFocused) return;

    const screenHitbox = screenHitboxRef.current;
    if (!screenHitbox) return;

    screenHitbox.updateWorldMatrix(true, false);

    const nextRect = getProjectedMeshRect(screenHitbox, camera, size);
    if (!nextRect) return;

    const prevRect = lastScreenRectRef.current;
    const hasMeaningfulChange =
      !prevRect ||
      Math.abs(prevRect.left - nextRect.left) > 0.5 ||
      Math.abs(prevRect.top - nextRect.top) > 0.5 ||
      Math.abs(prevRect.width - nextRect.width) > 0.5 ||
      Math.abs(prevRect.height - nextRect.height) > 0.5;

    if (!hasMeaningfulChange) return;

    lastScreenRectRef.current = nextRect;
    onScreenRectChange(nextRect);
  });

  const handlePointerDown = (event) => {
    if (event.object.name !== "Screen_Hitbox") return;

    event.stopPropagation();
    console.log("Screen_Hitbox clicked", {
      objectName: event.object.name,
      point: event.point.toArray().map((value) => Number(value.toFixed(3))),
    });
    onScreenClick();
  };

  return (
    <Center>
      <group ref={modelGroupRef} rotation={[0, -Math.PI / 2, 0]}>
        <primitive object={model} onPointerDown={handlePointerDown} />
      </group>
    </Center>
  );
}

function Loader() {
  return (
    <Html center>
      <div className="loader">Loading 3D scene...</div>
    </Html>
  );
}

useGLTF.preload(MODEL_PATH);

function WelcomePopup({ isVisible, onEnterWorld }) {
  if (!isVisible) return null;

  return (
    <Html
      center
      className="scene-welcome"
      distanceFactor={1.7}
      position={INTRO_POPUP_POSITION}
      sprite
      transform
    >
      <section className="welcome-popup" aria-live="polite">
        <h1>Welcome to my portfolio</h1>
        <p className="welcome-popup__line">
          Click on the monitor screen to see my portfolio.
        </p>
        <button
          className="welcome-popup__button"
          onClick={onEnterWorld}
          type="button"
        >
          Explore the world
        </button>
      </section>
    </Html>
  );
}

function FolderIcon({ title, onOpen }) {
  return (
    <button
      className="desktop-folder"
      onClick={() => onOpen(title)}
      type="button"
    >
      <span className="desktop-folder__icon" aria-hidden="true">
        <svg viewBox="0 0 64 52" role="presentation">
          <path
            d="M6 14a6 6 0 0 1 6-6h14l5 6h21a6 6 0 0 1 6 6v20a8 8 0 0 1-8 8H12a8 8 0 0 1-8-8V14Z"
            fill="#f1bf42"
          />
          <path
            d="M4 20a6 6 0 0 1 6-6h42a6 6 0 0 1 6 6v4H4v-4Z"
            fill="#ffd56a"
          />
        </svg>
      </span>
      <span className="desktop-folder__label">{title}</span>
    </button>
  );
}

function DesktopWindow({ className = "", title, onClose }) {
  const sections = FOLDER_CONTENT[title];

  return (
    <section className={`desktop-window ${className}`.trim()}>
      <header className="desktop-window__header">
        <strong>{title}</strong>
        <button
          aria-label="Close window"
          className="desktop-window__close"
          onClick={onClose}
          type="button"
        >
          x
        </button>
      </header>
      <div className="desktop-window__body">
        {sections ? (
          sections.map((section) => (
            <section className="desktop-window__section" key={section.heading}>
              <h2>{section.heading}</h2>
              <p>{section.body}</p>
              {section.link ? (
                <a
                  className="desktop-window__link"
                  href={section.link}
                  rel="noreferrer"
                  target="_blank"
                >
                  {section.linkLabel ?? "GitHub"}
                </a>
              ) : null}
            </section>
          ))
        ) : (
          <>
            <p>{title}</p>
            <p>Placeholder content for the {title} folder.</p>
          </>
        )}
      </div>
    </section>
  );
}

function MobileFolderTab({ isActive, title, onOpen }) {
  return (
    <button
      className={`mobile-folder-tab${isActive ? " mobile-folder-tab--active" : ""}`}
      onClick={() => onOpen(title)}
      type="button"
    >
      {title}
    </button>
  );
}

function DesktopScreen({ isMobile, isVisible, opacity, screenRect }) {
  const [openWindow, setOpenWindow] = useState(null);

  useEffect(() => {
    if (!isVisible) {
      setOpenWindow(null);
    }
  }, [isVisible]);

  if (!isVisible || !screenRect) return null;

  if (isMobile) {
    return (
      <section className="desktop-screen desktop-screen--mobile" style={{ opacity }}>
        <div className="desktop-screen__mobile-shell">
          <div className="desktop-screen__mobile-folders">
            {DESKTOP_FOLDERS.map((folder) => (
              <MobileFolderTab
                key={folder}
                isActive={openWindow === folder}
                onOpen={setOpenWindow}
                title={folder}
              />
            ))}
          </div>

          {openWindow ? (
            <DesktopWindow
              className="desktop-window--mobile"
              title={openWindow}
              onClose={() => setOpenWindow(null)}
            />
          ) : (
            <section className="desktop-screen__mobile-placeholder">
              <p>Tap a folder to open it.</p>
            </section>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="desktop-screen">
      <div
        className="desktop-screen__anchor"
        style={{
          left: `${screenRect.left}px`,
          opacity,
          top: `${screenRect.top}px`,
          width: `${screenRect.width}px`,
          height: `${screenRect.height}px`,
        }}
      >
        <div className="desktop-screen__surface">
          <div className="desktop-screen__folders">
            {DESKTOP_FOLDERS.map((folder) => (
              <FolderIcon key={folder} title={folder} onOpen={setOpenWindow} />
            ))}
          </div>

          {openWindow ? (
            <DesktopWindow
              title={openWindow}
              onClose={() => setOpenWindow(null)}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}

function CameraDebug({ controlsRef }) {
  const { camera } = useThree();

  useEffect(() => {
    if (!import.meta.env.DEV) return undefined;

    const controls = controlsRef.current;
    if (!controls) return undefined;

    const logState = () => {
      const position = camera.position
        .toArray()
        .map((value) => Number(value.toFixed(3)));
      const target = controls.target
        .toArray()
        .map((value) => Number(value.toFixed(3)));

      console.log("[R3F camera]", { position, target });
    };

    logState();
    controls.addEventListener("change", logState);

    return () => controls.removeEventListener("change", logState);
  }, [camera, controlsRef]);

  return null;
}

function CameraRig({
  controlsRef,
  hasEnteredWorld,
  isScreenFocused,
  isMobile,
  isRoomTransitioning,
  onScreenRevealChange,
  screenTarget,
}) {
  const { camera } = useThree();
  const introPosition = useMemo(
    () => new THREE.Vector3(...INTRO_CAMERA_POSITION),
    [],
  );
  const introTarget = useMemo(() => new THREE.Vector3(...INTRO_TARGET), []);
  const roomPosition = useMemo(
    () => new THREE.Vector3(...ROOM_CAMERA_POSITION),
    [],
  );

  const roomTarget = useMemo(() => new THREE.Vector3(...ROOM_TARGET), []);

  const desiredPosition = useRef(roomPosition.clone());
  const desiredTarget = useRef(roomTarget.clone());

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    let nextReveal = 0;

    if (!hasEnteredWorld) {
      desiredPosition.current.copy(introPosition);
      desiredTarget.current.copy(introTarget);
    } else if (isScreenFocused && screenTarget) {
      const screenCenter = new THREE.Vector3(...screenTarget.position);
      const directionFromScreenToRoomCamera = roomPosition
        .clone()
        .sub(screenCenter);
      directionFromScreenToRoomCamera.y = 0;

      if (directionFromScreenToRoomCamera.lengthSq() === 0) {
        directionFromScreenToRoomCamera.set(0, 0, 1);
      } else {
        directionFromScreenToRoomCamera.normalize();
      }

      const leftVector = new THREE.Vector3()
        .crossVectors(
          directionFromScreenToRoomCamera,
          new THREE.Vector3(0, 0, 0),
        )
        .normalize();
      const focusTarget = screenCenter
        .clone()
        .add(leftVector.multiplyScalar(0.08));

      const focusDistance = isMobile ? 0.78 : 1.15;
      const focusPosition = screenCenter
        .clone()
        .add(directionFromScreenToRoomCamera.multiplyScalar(focusDistance));
      focusPosition.y = screenCenter.y;

      const totalDistance = roomPosition.distanceTo(focusPosition);
      desiredPosition.current.copy(focusPosition);
      desiredTarget.current.copy(focusTarget);

      const currentDistance = camera.position.distanceTo(focusPosition);
      const travelProgress = THREE.MathUtils.clamp(
        1 - currentDistance / Math.max(totalDistance, 0.001),
        0,
        1,
      );
      nextReveal = THREE.MathUtils.smoothstep(
        travelProgress,
        isMobile ? 0.82 : 0.9,
        isMobile ? 0.93 : 0.955,
      );
    } else if (isRoomTransitioning) {
      desiredPosition.current.copy(roomPosition);
      desiredTarget.current.copy(roomTarget);
    } else {
      onScreenRevealChange(nextReveal);
      return;
    }

    const damping = 1 - Math.exp(-4 * delta);
    camera.position.lerp(desiredPosition.current, damping);
    controls.target.lerp(desiredTarget.current, damping);
    controls.update();
    onScreenRevealChange(nextReveal);
  });

  return null;
}

export default function App() {
  const controlsRef = useRef(null);
  const [hasEnteredWorld, setHasEnteredWorld] = useState(false);
  const [isScreenFocused, setIsScreenFocused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isRoomTransitioning, setIsRoomTransitioning] = useState(false);
  const [isMobileScreenUiVisible, setIsMobileScreenUiVisible] = useState(false);
  const [screenReveal, setScreenReveal] = useState(0);
  const [screenTarget, setScreenTarget] = useState(null);
  const [screenRect, setScreenRect] = useState(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const updateIsMobile = () => setIsMobile(mediaQuery.matches);

    updateIsMobile();
    mediaQuery.addEventListener("change", updateIsMobile);

    return () => mediaQuery.removeEventListener("change", updateIsMobile);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setIsMobileScreenUiVisible(false);
      return undefined;
    }

    if (!isScreenFocused) {
      setIsMobileScreenUiVisible(false);
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setIsMobileScreenUiVisible(true);
    }, MOBILE_SCREEN_UI_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [isMobile, isScreenFocused]);

  useEffect(() => {
    if (!hasEnteredWorld || isScreenFocused) return undefined;

    setIsRoomTransitioning(true);

    const timeoutId = window.setTimeout(() => {
      setIsRoomTransitioning(false);
    }, ROOM_TRANSITION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [hasEnteredWorld, isScreenFocused]);

  return (
    <main className="app-shell">
      {!hasEnteredWorld ? <div className="intro-scene-blur" aria-hidden="true" /> : null}

      {isScreenFocused ? (
        <button
          className="back-button"
          onClick={() => {
            setIsScreenFocused(false);
            setIsRoomTransitioning(true);
          }}
          type="button"
        >
          Back to room
        </button>
      ) : null}

      <DesktopScreen
        isMobile={isMobile}
        isVisible={isMobile ? isMobileScreenUiVisible : isScreenFocused}
        opacity={isMobile ? 1 : screenReveal}
        screenRect={screenRect}
      />

      <Canvas
        camera={{
          position: INTRO_CAMERA_POSITION,
          fov: 60,
          near: 0.1,
          far: 200,
        }}
        dpr={[1, 1.5]}
        shadows
      >
        <color attach="background" args={["#0b1020"]} />
        <ambientLight intensity={1.2} />
        <directionalLight
          castShadow
          intensity={2.2}
          position={[8, 12, 10]}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <directionalLight intensity={0.8} position={[-6, 5, -8]} />

        <Suspense fallback={<Loader />}>
          <Model
            isScreenFocused={isScreenFocused}
            onScreenClick={() => {
              if (!hasEnteredWorld) return;
              setIsScreenFocused(true);
            }}
            onScreenReady={setScreenTarget}
            onScreenRectChange={setScreenRect}
          />
          <WelcomePopup
            isVisible={!hasEnteredWorld}
            onEnterWorld={() => {
              setHasEnteredWorld(true);
              setIsRoomTransitioning(true);
            }}
          />
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.08}
          target={INTRO_TARGET}
          enablePan={false}
          enableZoom={hasEnteredWorld && !isScreenFocused}
          enableRotate={hasEnteredWorld && !isScreenFocused}
          minAzimuthAngle={-Math.PI / 4}
          minDistance={isScreenFocused ? 0.9 : 2}
          maxAzimuthAngle={Math.PI / 4}
          maxDistance={isScreenFocused ? 2 : 20}
          maxPolarAngle={Math.PI / 2 + Math.PI / 9}
          minPolarAngle={Math.PI / 2 - Math.PI / 9}
        />
        <CameraRig
          controlsRef={controlsRef}
          hasEnteredWorld={hasEnteredWorld}
          isScreenFocused={isScreenFocused}
          isMobile={isMobile}
          isRoomTransitioning={isRoomTransitioning}
          onScreenRevealChange={setScreenReveal}
          screenTarget={screenTarget}
        />
        <CameraDebug controlsRef={controlsRef} />
      </Canvas>
    </main>
  );
}
